import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequestUser, AuthError } from "@/lib/firebase/server-auth";
import { Order, OrderStatus, Product } from "@/lib/types";
import {
  ORDER_STATUS_TRANSITIONS as ALLOWED_TRANSITIONS,
  RESTOCK_STATUSES,
  PAYMENT_STATUS_TRANSITIONS,
  PaymentStatus,
  isValidOrderStatus,
  isValidPaymentStatus,
  paymentHistoryNote,
} from "@/lib/orders";

const COURIERS = ["manual", "steadfast", "pathao", "redx", "paperfly"] as const;

type Courier = (typeof COURIERS)[number];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orderId = (await params).id;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    // Authenticate via the shared verifier: checks revoked tokens, suspended
    // accounts, and derives role from the verified custom claim.
    const { uid, role } = await verifyRequestUser(request);
    const isAdmin = role === "admin";
    if (!isAdmin && role !== "seller") {
      return NextResponse.json({ error: "Forbidden: seller or admin role required." }, { status: 403 });
    }

    const body = await request.json();
    const status = body.status as OrderStatus;
    const courier = (body.courier || null) as Courier | null;
    const trackingId = typeof body.trackingId === "string" ? body.trackingId.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";
    // Payment status is optional — omitting it leaves payment untouched so the
    // seller can update fulfilment and payment independently.
    const paymentStatusRaw =
      body.paymentStatus === undefined || body.paymentStatus === null || body.paymentStatus === ""
        ? null
        : body.paymentStatus;

    if (!isValidOrderStatus(status)) {
      return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    }

    if (paymentStatusRaw !== null && !isValidPaymentStatus(paymentStatusRaw)) {
      return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
    }
    const paymentStatus = paymentStatusRaw as PaymentStatus | null;

    if (courier && !COURIERS.includes(courier)) {
      return NextResponse.json({ error: "Invalid courier partner." }, { status: 400 });
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const now = Date.now();

    let updatedOrder: Partial<Order> | null = null;

    await adminDb.runTransaction(async (transaction) => {
      // ---- READS FIRST ----
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) {
        throw new Error("Order not found.");
      }

      const beforeData = { id: orderSnap.id, ...orderSnap.data() } as Order;
      const isOwner = beforeData.storeOwnerUid === uid;
      if (!isOwner && !isAdmin) {
        throw new Error("Forbidden: You do not have permission to update this order.");
      }

      // Validate the transition against the state-machine (no-op to same status
      // is allowed so fulfilment/payment-only edits can go through).
      const currentStatus = beforeData.status;
      if (currentStatus !== status) {
        const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(status)) {
          throw new Error(
            `Invalid status transition: "${currentStatus}" cannot move to "${status}".`
          );
        }
      }

      // Validate the payment-status transition when one is requested.
      const currentPayment = (beforeData.payment?.status || "pending") as PaymentStatus;
      const paymentChanged = paymentStatus !== null && paymentStatus !== currentPayment;
      if (paymentChanged) {
        const allowedPayment = PAYMENT_STATUS_TRANSITIONS[currentPayment] || [];
        if (!allowedPayment.includes(paymentStatus as PaymentStatus)) {
          throw new Error(
            `Invalid payment transition: "${currentPayment}" cannot move to "${paymentStatus}".`
          );
        }
      }

      const willRestock =
        currentStatus !== status &&
        RESTOCK_STATUSES.includes(status) &&
        !RESTOCK_STATUSES.includes(currentStatus);

      // If we are releasing inventory, read every affected product BEFORE any write.
      const productRefs: Record<string, FirebaseFirestore.DocumentReference> = {};
      const productData: Record<string, Product> = {};
      let storeRef: FirebaseFirestore.DocumentReference | null = null;
      if (willRestock) {
        const uniqueProductIds = Array.from(
          new Set((beforeData.items || []).map((i) => i.productId))
        );
        for (const pid of uniqueProductIds) {
          const ref = adminDb.collection("products").doc(pid);
          const snap = await transaction.get(ref);
          if (snap.exists) {
            productRefs[pid] = ref;
            productData[pid] = { id: snap.id, ...snap.data() } as Product;
          }
        }
        // Read the store so we can reverse the accrued sales.
        if (beforeData.storeId) {
          const sRef = adminDb.collection("stores").doc(beforeData.storeId);
          const sSnap = await transaction.get(sRef);
          if (sSnap.exists) storeRef = sRef;
        }
      }

      // ---- WRITES ----
      if (willRestock) {
        // Aggregate restock quantities per product/variant, then decrement totalSold.
        for (const pid of Object.keys(productData)) {
          const product = productData[pid];
          const itemsForProduct = (beforeData.items || []).filter((i) => i.productId === pid);
          const restockBySku: Record<string, number> = {};
          let soldBack = 0;
          for (const item of itemsForProduct) {
            restockBySku[item.variantSku] = (restockBySku[item.variantSku] || 0) + item.qty;
            soldBack += item.qty;
          }
          const variants = (product.variants || []).map((v) =>
            restockBySku[v.sku]
              ? { ...v, stock: (v.stock || 0) + restockBySku[v.sku] }
              : v
          );
          transaction.update(productRefs[pid], {
            variants,
            totalSold: Math.max(0, (product.totalSold || 0) - soldBack),
            updatedAt: now,
          });
        }
        // Reverse the store's accrued sales for this order's merchandise value.
        if (storeRef) {
          transaction.update(storeRef, {
            totalSales: FieldValue.increment(-(beforeData.totals?.subtotal || 0)),
          });
        }
      }

      const actor = isAdmin ? "admin" : "seller";
      const statusChanged = currentStatus !== status;

      // Build the timeline entries: one for the order-status change and/or one
      // for the payment change. If neither the status nor the payment moved
      // (courier/tracking-only edit) record a single fulfilment note.
      const newHistory: Order["statusHistory"] = [];
      if (statusChanged) {
        newHistory.push({
          status,
          at: now,
          by: actor,
          note: note || `Status updated to ${status} by ${actor}.`,
        });
      }
      if (paymentChanged) {
        newHistory.push({
          status,
          at: now,
          by: actor,
          note: paymentHistoryNote(paymentStatus as PaymentStatus, actor),
        });
      }
      if (!statusChanged && !paymentChanged) {
        newHistory.push({
          status,
          at: now,
          by: actor,
          note: note || `Fulfilment details updated by ${actor}.`,
        });
      }

      const shipping = {
        ...beforeData.shipping,
        ...(courier ? { courier } : {}),
        ...(trackingId ? { trackingId } : {}),
      };

      const updatePayload: Partial<Order> = {
        status,
        shipping,
        statusHistory: [...(beforeData.statusHistory || []), ...newHistory],
        updatedAt: now,
      };
      if (paymentChanged) {
        updatePayload.payment = { ...beforeData.payment, status: paymentStatus as PaymentStatus };
      }
      updatedOrder = updatePayload;

      transaction.update(orderRef, updatePayload);

      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        actorUid: uid,
        actorRole: isAdmin ? "admin" : "seller",
        action: "order.fulfillment_update",
        entity: "order",
        entityId: orderId,
        before: { status: currentStatus, paymentStatus: currentPayment },
        after: {
          status,
          paymentStatus: paymentChanged ? paymentStatus : currentPayment,
          restocked: willRestock,
        },
        at: now,
      });
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to update seller order:", error);
    const message = error.message || "Internal server error";
    let status = 500;
    if (message.startsWith("Forbidden")) status = 403;
    else if (message === "Order not found.") status = 404;
    else if (message.startsWith("Invalid")) status = 400;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequestUser, AuthError } from "@/lib/firebase/server-auth";
import { Order, OrderStatus, Product } from "@/lib/types";

const COURIERS = ["manual", "steadfast", "pathao", "redx", "paperfly"] as const;

type Courier = (typeof COURIERS)[number];

// Order status state-machine. A status may only move to one of its allowed next
// states; `cancelled` and `returned` are terminal. This prevents nonsensical
// transitions (e.g. delivered -> pending) that would corrupt the lifecycle.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  returned: [],
  cancelled: [],
};

// Transitioning into one of these releases the reserved inventory back to stock.
const RESTOCK_STATUSES: OrderStatus[] = ["cancelled", "returned"];

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

    if (!Object.prototype.hasOwnProperty.call(ALLOWED_TRANSITIONS, status)) {
      return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    }

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
      // is rejected — nothing to record).
      const currentStatus = beforeData.status;
      if (currentStatus !== status) {
        const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(status)) {
          throw new Error(
            `Invalid status transition: "${currentStatus}" cannot move to "${status}".`
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

      const historyEntry = {
        status,
        at: now,
        by: isAdmin ? "admin" : "seller",
        note: note || `Status updated to ${status} by ${isAdmin ? "admin" : "seller"}.`,
      };

      const shipping = {
        ...beforeData.shipping,
        ...(courier ? { courier } : {}),
        ...(trackingId ? { trackingId } : {}),
      };

      const updatePayload: Partial<Order> = {
        status,
        shipping,
        statusHistory: [...(beforeData.statusHistory || []), historyEntry],
        updatedAt: now,
      };
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
        before: { status: currentStatus },
        after: { status, restocked: willRestock },
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

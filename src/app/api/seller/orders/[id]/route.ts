import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { Order, OrderStatus } from "@/lib/types";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
];

const COURIERS = ["manual", "steadfast", "pathao", "redx", "paperfly"] as const;

type Courier = (typeof COURIERS)[number];

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    let token = "";
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = request.cookies.get("firebase-token")?.value || "";
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    let uid = "";
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (err) {
      console.error("Token verification failed:", err);
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const status = body.status as OrderStatus;
    const courier = (body.courier || null) as Courier | null;
    const trackingId = typeof body.trackingId === "string" ? body.trackingId.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    }

    if (courier && !COURIERS.includes(courier)) {
      return NextResponse.json({ error: "Invalid courier partner." }, { status: 400 });
    }

    const userSnap = await adminDb.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "Unauthorized: User profile not found." }, { status: 401 });
    }

    const userData = userSnap.data();
    const isAdmin = userData?.role === "admin";
    const orderRef = adminDb.collection("orders").doc(orderId);
    const now = Date.now();

    let updatedOrder: Partial<Order> | null = null;

    await adminDb.runTransaction(async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) {
        throw new Error("Order not found.");
      }

      const beforeData = { id: orderSnap.id, ...orderSnap.data() } as Order;
      const isOwner = beforeData.storeOwnerUid === uid;
      if (!isOwner && !isAdmin) {
        throw new Error("Forbidden: You do not have permission to update this order.");
      }

      const historyEntry = {
        status,
        at: now,
        by: isAdmin ? "admin" : "seller",
        note: note || `Status updated to ${status} by ${isAdmin ? "admin" : "seller"}.`,
      };

      const shipping = {
        ...beforeData.shipping,
        courier: courier || undefined,
        trackingId: trackingId || undefined,
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
        before: beforeData,
        after: { ...beforeData, ...updatedOrder },
        at: now,
      });
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Failed to update seller order:", error);
    const message = error.message || "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message === "Order not found." ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
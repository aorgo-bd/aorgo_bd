import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/firebase/admin-helpers";

const ADMIN_LIST_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    // Server-side (Admin SDK) read so the admin orders list and dashboard KPIs
    // are always populated. A direct client Firestore query is gated by the
    // isAdmin() rule, which relies on a fresh `role: admin` claim on the ambient
    // SDK token and silently returns empty when that claim is stale. Same
    // rationale as the sellers/products/banners/users admin routes.
    const snap = await adminDb
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(ADMIN_LIST_LIMIT)
      .get();
    const orders = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ orders });
  } catch (error: any) {
    const status = error?.status || 500;
    console.error("Failed to list orders:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status }
    );
  }
}

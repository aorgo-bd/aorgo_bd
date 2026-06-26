import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/firebase/admin-helpers";

export async function PUT(request: NextRequest) {
  try {
    const { uid } = await verifyAdmin(request);
    const body = await request.json();
    const { storeId, status } = body;

    if (!storeId || !["approved", "suspended"].includes(status)) {
      return NextResponse.json({ error: "Invalid status or store ID" }, { status: 400 });
    }

    const storeRef = adminDb.collection("stores").doc(storeId);
    const storeSnap = await storeRef.get();
    if (!storeSnap.exists) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const beforeData = storeSnap.data();
    const ownerUid = beforeData?.ownerUid;

    const afterData = {
      ...beforeData,
      status,
      updatedAt: Date.now(),
      ...(status === "approved" && !beforeData?.approvedAt ? { approvedAt: Date.now() } : {}),
    };

    await adminDb.runTransaction(async (transaction) => {
      transaction.update(storeRef, {
        status,
        updatedAt: Date.now(),
        ...(status === "approved" && !beforeData?.approvedAt ? { approvedAt: Date.now() } : {}),
      });

      if (ownerUid) {
        const userRef = adminDb.collection("users").doc(ownerUid);
        transaction.update(userRef, {
          role: status === "approved" ? "seller" : "customer",
          updatedAt: Date.now(),
        });
      }

      // Write audit log inside transaction
      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        actorUid: uid,
        actorRole: "admin",
        action: status === "approved" ? "store.approve" : "store.suspend",
        entity: "store",
        entityId: storeId,
        before: beforeData || null,
        after: afterData,
        at: Date.now(),
      });
    });

    if (ownerUid) {
      const targetRole = status === "approved" ? "seller" : "customer";
      await adminAuth.setCustomUserClaims(ownerUid, { role: targetRole });
    }

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error("Failed to update store status:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

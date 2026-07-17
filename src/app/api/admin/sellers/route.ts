import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/firebase/admin-helpers";

const ADMIN_LIST_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    // Read through the Admin SDK so admins see stores in every state (pending,
    // approved, suspended). The client-side rules read requires the ambient SDK
    // token to carry a `role: admin` claim, which is unreliable and silently
    // returns an empty list for the resource-conditioned read rule.
    const snap = await adminDb
      .collection("stores")
      .orderBy("createdAt", "desc")
      .limit(ADMIN_LIST_LIMIT)
      .get();
    const stores = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ stores });
  } catch (error: any) {
    const status = error?.status || 500;
    console.error("Failed to list stores:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { uid } = await verifyAdmin(request);
    const body = await request.json();
    const { storeId, status, verified } = body;

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    const storeRef = adminDb.collection("stores").doc(storeId);
    const storeSnap = await storeRef.get();
    if (!storeSnap.exists) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const beforeData = storeSnap.data();

    // --- Commission rate update (independent of approval status) ---
    // The client sends a percentage (0-100); we persist the canonical fraction
    // (e.g. 12.5% -> 0.125) rounded to two decimal places of a percent.
    if (body.commissionPercent !== undefined) {
      const percent = Number(body.commissionPercent);
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        return NextResponse.json(
          { error: "Commission must be a number between 0 and 100%." },
          { status: 400 }
        );
      }
      const commissionRate = Math.round(percent * 100) / 10000;
      await storeRef.update({ commissionRate, updatedAt: Date.now() });
      const auditRef = adminDb.collection("audit_logs").doc();
      await auditRef.set({
        id: auditRef.id,
        actorUid: uid,
        actorRole: "admin",
        action: "store.commission_update",
        entity: "store",
        entityId: storeId,
        before: { commissionRate: beforeData?.commissionRate ?? null },
        after: { commissionRate },
        at: Date.now(),
      });
      return NextResponse.json({ success: true, commissionRate });
    }

    // --- Verification badge toggle (independent of approval status) ---
    if (typeof verified === "boolean") {
      await storeRef.update({ verified, updatedAt: Date.now() });
      const auditRef = adminDb.collection("audit_logs").doc();
      await auditRef.set({
        id: auditRef.id,
        actorUid: uid,
        actorRole: "admin",
        action: verified ? "store.verify" : "store.unverify",
        entity: "store",
        entityId: storeId,
        before: beforeData || null,
        after: { ...beforeData, verified },
        at: Date.now(),
      });
      return NextResponse.json({ success: true, verified });
    }

    if (!["approved", "suspended"].includes(status)) {
      return NextResponse.json({ error: "Invalid status or store ID" }, { status: 400 });
    }

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

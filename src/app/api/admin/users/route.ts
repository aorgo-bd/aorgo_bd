import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/firebase/admin-helpers";

export async function PUT(request: NextRequest) {
  try {
    const { uid: actorUid } = await verifyAdmin(request);
    const body = await request.json();
    const { targetUid, action } = body;

    if (!targetUid || !["promote_admin", "toggle_suspend"].includes(action)) {
      return NextResponse.json({ error: "Invalid action or target UID" }, { status: 400 });
    }

    if (targetUid === actorUid) {
      return NextResponse.json({ error: "You cannot perform actions on your own profile" }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(targetUid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data();

    if (action === "promote_admin") {
      await adminDb.runTransaction(async (transaction) => {
        transaction.update(userRef, {
          role: "admin",
          updatedAt: Date.now(),
        });

        // Audit Log
        const auditRef = adminDb.collection("audit_logs").doc();
        transaction.set(auditRef, {
          id: auditRef.id,
          actorUid,
          actorRole: "admin",
          action: "user.promote",
          entity: "user",
          entityId: targetUid,
          before: userData || null,
          after: { ...userData, role: "admin" },
          at: Date.now(),
        });
      });

      // Set admin custom claims
      await adminAuth.setCustomUserClaims(targetUid, { role: "admin" });
      // Force the target's tokens to refresh so the new role claim propagates on
      // their next request instead of after the (up to 1h) natural token refresh.
      await adminAuth.revokeRefreshTokens(targetUid);

      return NextResponse.json({ success: true, message: "User promoted to Admin successfully" });
    }

    if (action === "toggle_suspend") {
      const isSuspended = !!userData?.suspended;
      const nextSuspended = !isSuspended;

      await adminDb.runTransaction(async (transaction) => {
        transaction.update(userRef, {
          suspended: nextSuspended,
          updatedAt: Date.now(),
        });

        // Audit Log
        const auditRef = adminDb.collection("audit_logs").doc();
        transaction.set(auditRef, {
          id: auditRef.id,
          actorUid,
          actorRole: "admin",
          action: nextSuspended ? "user.suspend" : "user.unsuspend",
          entity: "user",
          entityId: targetUid,
          before: userData || null,
          after: { ...userData, suspended: nextSuspended },
          at: Date.now(),
        });
      });

      // Revoke refresh tokens so a suspended user is forced to re-authenticate
      // (and is then blocked at login/session creation) rather than continuing
      // on a still-valid token.
      await adminAuth.revokeRefreshTokens(targetUid);

      return NextResponse.json({
        success: true,
        suspended: nextSuspended,
        message: nextSuspended ? "User suspended successfully" : "User unsuspended successfully",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Failed to perform user action:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

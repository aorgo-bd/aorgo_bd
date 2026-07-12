import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/firebase/admin-helpers";

const ADMIN_LIST_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    // Server-side (Admin SDK) read so the administrative activity log always
    // renders. audit_logs is admin-read-only in the security rules, so a direct
    // client query depends on a fresh `role: admin` claim and silently returns
    // empty when the ambient token is stale. Same rationale as the other admin
    // list routes.
    const snap = await adminDb
      .collection("audit_logs")
      .orderBy("at", "desc")
      .limit(ADMIN_LIST_LIMIT)
      .get();
    const auditLogs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ auditLogs });
  } catch (error: any) {
    const status = error?.status || 500;
    console.error("Failed to list audit logs:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status }
    );
  }
}

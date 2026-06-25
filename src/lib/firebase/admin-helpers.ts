import "server-only";
import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "./admin";
import { Role } from "../types";

export async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  let token = "";
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    token = request.cookies.get("firebase-token")?.value || "";
  }

  if (!token) {
    throw new Error("Unauthorized: Missing token");
  }

  const decodedToken = await adminAuth.verifyIdToken(token);
  const uid = decodedToken.uid;

  const userSnap = await adminDb.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    throw new Error("Unauthorized: User not found");
  }

  const userData = userSnap.data();
  if (userData?.role !== "admin") {
    throw new Error("Unauthorized: Admin privileges required");
  }

  return { uid, userData };
}

export async function writeAuditLog({
  actorUid,
  actorRole,
  action,
  entity,
  entityId,
  before,
  after,
}: {
  actorUid: string;
  actorRole: Role;
  action: string;
  entity: string;
  entityId: string;
  before?: any;
  after?: any;
}) {
  const auditLogsRef = adminDb.collection("audit_logs");
  const logId = auditLogsRef.doc().id;
  const auditLog = {
    id: logId,
    actorUid,
    actorRole,
    action,
    entity,
    entityId,
    before: before || null,
    after: after || null,
    at: Date.now(),
  };
  await auditLogsRef.doc(logId).set(auditLog);
}

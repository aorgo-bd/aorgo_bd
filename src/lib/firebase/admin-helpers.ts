import "server-only";
import { NextRequest } from "next/server";
import { adminDb } from "./admin";
import { Role } from "../types";
import { requireRole } from "./server-auth";

export async function verifyAdmin(request: NextRequest) {
  return requireRole(request, ["admin"]);
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
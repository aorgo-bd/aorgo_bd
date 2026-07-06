import "server-only";
import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "./admin";
import { Role, User } from "../types";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export type VerifiedRequestUser = {
  uid: string;
  role: Role;
  userData: User & { suspended?: boolean; storeId?: string };
};

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return "";
}

export async function verifyRequestUser(request: NextRequest): Promise<VerifiedRequestUser> {
  const bearerToken = getBearerToken(request);
  const sessionCookie = request.cookies.get("session")?.value;
  const legacyIdTokenCookie = request.cookies.get("firebase-token")?.value;

  if (!bearerToken && !sessionCookie && !legacyIdTokenCookie) {
    throw new AuthError("Unauthorized: Missing session");
  }

  let uid = "";
  if (bearerToken) {
    const decoded = await adminAuth.verifyIdToken(bearerToken, true);
    uid = decoded.uid;
  } else if (sessionCookie) {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } else if (legacyIdTokenCookie) {
    const decoded = await adminAuth.verifyIdToken(legacyIdTokenCookie, true);
    uid = decoded.uid;
  } else {
    throw new AuthError("Unauthorized: Missing session");
  }

  const userSnap = await adminDb.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    throw new AuthError("Unauthorized: User profile not found", 404);
  }

  const userData = userSnap.data() as User & { suspended?: boolean; storeId?: string };
  if (userData.suspended) {
    throw new AuthError("Account suspended", 403);
  }

  return {
    uid,
    role: userData.role || "customer",
    userData,
  };
}

export async function requireRole(request: NextRequest, allowedRoles: Role[]) {
  const verified = await verifyRequestUser(request);
  if (!allowedRoles.includes(verified.role)) {
    throw new AuthError("Forbidden: Insufficient privileges", 403);
  }
  return verified;
}


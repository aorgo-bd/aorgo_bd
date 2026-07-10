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
  // Role is taken from the *verified* custom claim, never the Firestore user doc.
  // The users-create rule lets a user self-assign role:"seller" in their own doc,
  // so trusting that field would be privilege-escalatable. Custom claims are only
  // settable server-side via the Admin SDK (seller approval / admin promotion).
  let claimRole: unknown;
  if (bearerToken) {
    const decoded = await adminAuth.verifyIdToken(bearerToken, true);
    uid = decoded.uid;
    claimRole = decoded.role;
  } else if (sessionCookie) {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
    claimRole = decoded.role;
  } else if (legacyIdTokenCookie) {
    const decoded = await adminAuth.verifyIdToken(legacyIdTokenCookie, true);
    uid = decoded.uid;
    claimRole = decoded.role;
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

  const role: Role =
    claimRole === "admin" || claimRole === "seller" || claimRole === "customer"
      ? claimRole
      : "customer";

  return {
    uid,
    role,
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


import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const userData = userSnap.data();
    if (userData?.suspended) {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });

    const response = NextResponse.json({
      success: true,
      role: userData?.role || "customer",
    });
    response.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    response.cookies.delete("firebase-token");
    response.cookies.delete("user-role");
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("session");
  response.cookies.delete("firebase-token");
  response.cookies.delete("user-role");
  return response;
}

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Persist newsletter sign-ups. Uses the email (normalized) as the doc id so
// re-subscribing is idempotent instead of creating duplicates.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid email" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const docId = Buffer.from(email).toString("base64url");

    await adminDb.collection("newsletter_subscribers").doc(docId).set(
      {
        email,
        subscribedAt: Date.now(),
        source: "footer",
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Newsletter subscription failed:", error);
    return NextResponse.json({ error: "Could not subscribe right now. Please try again." }, { status: 500 });
  }
}

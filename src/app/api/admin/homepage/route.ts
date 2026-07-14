import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/firebase/admin-helpers";
import { homepageSchema } from "@/lib/schemas";
import { DEFAULT_HOMEPAGE, mergeHomepage } from "@/lib/data/homepage-defaults";

const HOMEPAGE_DOC = "homepage";

// Load current homepage content (admin only). Merges over defaults so the form
// always receives a complete, valid shape even before the doc is first saved.
export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
    const snap = await adminDb.collection("settings").doc(HOMEPAGE_DOC).get();
    const homepage = snap.exists ? mergeHomepage(snap.data()) : DEFAULT_HOMEPAGE;
    return NextResponse.json({ homepage });
  } catch (error: any) {
    const status = error?.status || 500;
    return NextResponse.json({ error: error.message || "Internal server error" }, { status });
  }
}

// Persist homepage content (admin only) with an audit-logged before/after.
export async function PUT(request: NextRequest) {
  try {
    const { uid } = await verifyAdmin(request);
    const body = await request.json();

    const validated = homepageSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid homepage data", details: validated.error.format() },
        { status: 400 }
      );
    }

    const ref = adminDb.collection("settings").doc(HOMEPAGE_DOC);
    const beforeSnap = await ref.get();
    const beforeData = beforeSnap.exists ? beforeSnap.data() : null;

    const afterData = {
      ...validated.data,
      updatedAt: Date.now(),
      updatedBy: uid,
    };

    await adminDb.runTransaction(async (transaction) => {
      transaction.set(ref, afterData);

      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        actorUid: uid,
        actorRole: "admin",
        action: "homepage.update",
        entity: "settings",
        entityId: HOMEPAGE_DOC,
        before: beforeData,
        after: afterData,
        at: Date.now(),
      });
    });

    // The storefront home page reads this on the server; bust its cache.
    revalidatePath("/");

    return NextResponse.json({ success: true, homepage: afterData });
  } catch (error: any) {
    console.error("Failed to update homepage settings:", error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error.message || "Internal server error" }, { status });
  }
}

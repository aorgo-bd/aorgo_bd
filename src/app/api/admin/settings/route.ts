import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/firebase/admin-helpers";
import { settingsSchema } from "@/lib/schemas";
import { StorefrontSettings } from "@/lib/types";

const SETTINGS_DOC = "storefront";

const DEFAULT_SETTINGS: StorefrontSettings = {
  siteName: "AORGO",
  supportEmail: "support@aorgo.com",
  supportPhone: "01700000000",
  announcement: "",
  announcementActive: false,
  freeShippingThreshold: 0,
  defaultShippingFee: 60,
  defaultCommissionRate: 10,
  codEnabled: true,
  maintenanceMode: false,
  socialFacebook: "",
  socialInstagram: "",
};

// Load current storefront settings (admin only). Falls back to defaults so the
// form always has a complete, valid shape even before the doc is first saved.
export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
    const snap = await adminDb.collection("settings").doc(SETTINGS_DOC).get();
    const settings = snap.exists
      ? { ...DEFAULT_SETTINGS, ...snap.data() }
      : DEFAULT_SETTINGS;
    return NextResponse.json({ settings });
  } catch (error: any) {
    const status = error?.status || 500;
    return NextResponse.json({ error: error.message || "Internal server error" }, { status });
  }
}

// Persist storefront settings (admin only) with an audit-logged before/after.
export async function PUT(request: NextRequest) {
  try {
    const { uid } = await verifyAdmin(request);
    const body = await request.json();

    const validated = settingsSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid settings data", details: validated.error.format() },
        { status: 400 }
      );
    }

    const settingsRef = adminDb.collection("settings").doc(SETTINGS_DOC);
    const beforeSnap = await settingsRef.get();
    const beforeData = beforeSnap.exists ? beforeSnap.data() : null;

    const afterData = {
      ...validated.data,
      updatedAt: Date.now(),
      updatedBy: uid,
    };

    await adminDb.runTransaction(async (transaction) => {
      transaction.set(settingsRef, afterData, { merge: true });

      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        actorUid: uid,
        actorRole: "admin",
        action: "settings.update",
        entity: "settings",
        entityId: SETTINGS_DOC,
        before: beforeData,
        after: afterData,
        at: Date.now(),
      });
    });

    // Storefront reads these settings on the server; bust the home cache.
    revalidatePath("/");

    return NextResponse.json({ success: true, settings: afterData });
  } catch (error: any) {
    console.error("Failed to update settings:", error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error.message || "Internal server error" }, { status });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/firebase/admin-helpers";
import { bannerFormSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const { uid } = await verifyAdmin(request);
    const body = await request.json();

    const validated = bannerFormSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid banner data", details: validated.error.format() }, { status: 400 });
    }

    const data = validated.data;
    const bannerRef = adminDb.collection("banners").doc();
    const newBanner = {
      id: bannerRef.id,
      ...data,
      createdAt: Date.now(),
    };

    await adminDb.runTransaction(async (transaction) => {
      transaction.set(bannerRef, newBanner);

      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        actorUid: uid,
        actorRole: "admin",
        action: "banner.create",
        entity: "banner",
        entityId: bannerRef.id,
        before: null,
        after: newBanner,
        at: Date.now(),
      });
    });

    return NextResponse.json({ success: true, banner: newBanner });
  } catch (error: any) {
    console.error("Failed to create banner:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { uid } = await verifyAdmin(request);
    const body = await request.json();
    const { id, ...dataToValidate } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing banner ID" }, { status: 400 });
    }

    const validated = bannerFormSchema.safeParse(dataToValidate);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid banner data", details: validated.error.format() }, { status: 400 });
    }

    const data = validated.data;
    const bannerRef = adminDb.collection("banners").doc(id);
    const bannerSnap = await bannerRef.get();
    if (!bannerSnap.exists) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    const beforeData = bannerSnap.data();
    const afterData = {
      ...beforeData,
      ...data,
      updatedAt: Date.now(),
    };

    await adminDb.runTransaction(async (transaction) => {
      transaction.update(bannerRef, {
        ...data,
        updatedAt: Date.now(),
      });

      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        actorUid: uid,
        actorRole: "admin",
        action: "banner.update",
        entity: "banner",
        entityId: id,
        before: beforeData || null,
        after: afterData,
        at: Date.now(),
      });
    });

    return NextResponse.json({ success: true, banner: afterData });
  } catch (error: any) {
    console.error("Failed to update banner:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { uid } = await verifyAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing banner ID" }, { status: 400 });
    }

    const bannerRef = adminDb.collection("banners").doc(id);
    const bannerSnap = await bannerRef.get();
    if (!bannerSnap.exists) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    const beforeData = bannerSnap.data();

    await adminDb.runTransaction(async (transaction) => {
      transaction.delete(bannerRef);

      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        actorUid: uid,
        actorRole: "admin",
        action: "banner.delete",
        entity: "banner",
        entityId: id,
        before: beforeData || null,
        after: null,
        at: Date.now(),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete banner:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

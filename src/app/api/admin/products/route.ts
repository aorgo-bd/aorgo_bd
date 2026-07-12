import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/firebase/admin-helpers";

const ADMIN_LIST_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    // Read through the Admin SDK so admins see products in every state (draft,
    // pending, approved, rejected, archived). A client-side rules read requires
    // a fresh `role: admin` claim on the ambient SDK token and otherwise leaves
    // the moderation queue silently empty.
    const snap = await adminDb
      .collection("products")
      .orderBy("createdAt", "desc")
      .limit(ADMIN_LIST_LIMIT)
      .get();
    const products = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ products });
  } catch (error: any) {
    const status = error?.status || 500;
    console.error("Failed to list products:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { uid } = await verifyAdmin(request);
    const body = await request.json();
    const { productId, status, rejectionReason } = body;

    if (!productId || !["approved", "rejected", "archived"].includes(status)) {
      return NextResponse.json({ error: "Invalid status or product ID" }, { status: 400 });
    }

    if (status === "rejected" && !rejectionReason?.trim()) {
      return NextResponse.json({ error: "Rejection reason is required when rejecting a product" }, { status: 400 });
    }

    const productRef = adminDb.collection("products").doc(productId);
    const productSnap = await productRef.get();
    if (!productSnap.exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const beforeData = productSnap.data();
    const afterData = {
      ...beforeData,
      status,
      updatedAt: Date.now(),
      rejectionReason: status === "rejected" ? rejectionReason : null,
    };

    await adminDb.runTransaction(async (transaction) => {
      transaction.update(productRef, {
        status,
        updatedAt: Date.now(),
        rejectionReason: status === "rejected" ? rejectionReason : null,
      });

      // Write audit log inside transaction
      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        actorUid: uid,
        actorRole: "admin",
        action: `product.${status}`,
        entity: "product",
        entityId: productId,
        before: beforeData || null,
        after: afterData,
        at: Date.now(),
      });
    });

    revalidatePath("/");
    if (beforeData?.slug) {
      revalidatePath(`/product/${beforeData.slug}`);
    }
    if (beforeData?.category) {
      revalidatePath(`/category/${beforeData.category}`);
    }
    revalidatePath("/search");

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error("Failed to update product status:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

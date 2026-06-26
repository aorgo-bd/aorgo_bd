import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/firebase/admin-helpers";

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

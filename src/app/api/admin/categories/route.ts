import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/firebase/admin-helpers";
import { AuthError } from "@/lib/firebase/server-auth";
import { categoryFormSchema } from "@/lib/schemas";

// Categories are keyed by their slug (the Firestore document id), so the slug
// doubles as the stable identity. Creating uses the slug as the doc id; editing
// treats the slug as immutable and only touches the presentational fields.

function handleError(error: any, fallback: string) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(fallback, error);
  return NextResponse.json({ error: error?.message || fallback }, { status: 500 });
}

const normalizeParent = (parent: string | null | undefined) =>
  parent && parent.trim() ? parent.trim() : null;

export async function POST(request: NextRequest) {
  try {
    const { uid } = await verifyAdmin(request);
    const body = await request.json();

    const validated = categoryFormSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid category data", details: validated.error.format() },
        { status: 400 }
      );
    }

    const data = validated.data;
    const parent = normalizeParent(data.parent);

    const catRef = adminDb.collection("categories").doc(data.slug);
    const existing = await catRef.get();
    if (existing.exists) {
      return NextResponse.json(
        { error: `A category with slug "${data.slug}" already exists.` },
        { status: 409 }
      );
    }

    if (parent) {
      if (parent === data.slug) {
        return NextResponse.json({ error: "A category cannot be its own parent." }, { status: 400 });
      }
      const parentSnap = await adminDb.collection("categories").doc(parent).get();
      if (!parentSnap.exists) {
        return NextResponse.json({ error: `Parent category "${parent}" does not exist.` }, { status: 400 });
      }
    }

    const newCategory = {
      slug: data.slug,
      name: data.name,
      nameBn: data.nameBn || "",
      parent,
      image: data.image || "",
      order: data.order,
      productCount: 0,
      createdAt: Date.now(),
    };

    await adminDb.runTransaction(async (transaction) => {
      transaction.set(catRef, newCategory);

      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        actorUid: uid,
        actorRole: "admin",
        action: "category.create",
        entity: "category",
        entityId: data.slug,
        before: null,
        after: newCategory,
        at: Date.now(),
      });
    });

    revalidatePath("/");

    return NextResponse.json({ success: true, category: newCategory });
  } catch (error: any) {
    return handleError(error, "Failed to create category");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { uid } = await verifyAdmin(request);
    const body = await request.json();

    const validated = categoryFormSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid category data", details: validated.error.format() },
        { status: 400 }
      );
    }

    const data = validated.data;
    const parent = normalizeParent(data.parent);

    const catRef = adminDb.collection("categories").doc(data.slug);
    const snap = await catRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (parent) {
      if (parent === data.slug) {
        return NextResponse.json({ error: "A category cannot be its own parent." }, { status: 400 });
      }
      const parentSnap = await adminDb.collection("categories").doc(parent).get();
      if (!parentSnap.exists) {
        return NextResponse.json({ error: `Parent category "${parent}" does not exist.` }, { status: 400 });
      }
    }

    const before = snap.data();
    // Slug and productCount are intentionally not editable here.
    const updates = {
      name: data.name,
      nameBn: data.nameBn || "",
      parent,
      image: data.image || "",
      order: data.order,
      updatedAt: Date.now(),
    };
    const after = { ...before, ...updates };

    await adminDb.runTransaction(async (transaction) => {
      transaction.update(catRef, updates);

      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        actorUid: uid,
        actorRole: "admin",
        action: "category.update",
        entity: "category",
        entityId: data.slug,
        before: before || null,
        after,
        at: Date.now(),
      });
    });

    revalidatePath("/");

    return NextResponse.json({ success: true, category: after });
  } catch (error: any) {
    return handleError(error, "Failed to update category");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { uid } = await verifyAdmin(request);
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Missing category slug" }, { status: 400 });
    }

    const catRef = adminDb.collection("categories").doc(slug);
    const snap = await catRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Structural integrity: don't orphan subcategories.
    const children = await adminDb
      .collection("categories")
      .where("parent", "==", slug)
      .limit(1)
      .get();
    if (!children.empty) {
      return NextResponse.json(
        { error: "This category has subcategories. Delete or reassign them first." },
        { status: 409 }
      );
    }

    // Don't orphan products either.
    const products = await adminDb
      .collection("products")
      .where("category", "==", slug)
      .limit(1)
      .get();
    if (!products.empty) {
      return NextResponse.json(
        { error: "Products are assigned to this category. Reassign them before deleting." },
        { status: 409 }
      );
    }

    const before = snap.data();

    await adminDb.runTransaction(async (transaction) => {
      transaction.delete(catRef);

      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        actorUid: uid,
        actorRole: "admin",
        action: "category.delete",
        entity: "category",
        entityId: slug,
        before: before || null,
        after: null,
        at: Date.now(),
      });
    });

    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleError(error, "Failed to delete category");
  }
}

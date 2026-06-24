import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { productFormSchema } from "@/lib/schemas";
import { Product } from "@/lib/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    // 1. Authenticate user
    const authHeader = request.headers.get("authorization");
    let token = "";
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = request.cookies.get("firebase-token")?.value || "";
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    let uid = "";
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (err) {
      console.error("Token verification failed:", err);
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    // 2. Fetch Product from db to verify ownership
    const prodRef = adminDb.collection("products").doc(productId);
    const prodSnap = await prodRef.get();
    if (!prodSnap.exists) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const existingProduct = prodSnap.data() as Product;

    // Verify ownership (or admin status)
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    const isOwner = existingProduct.sellerUid === uid;
    const isAdmin = userData?.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You do not own this product." }, { status: 403 });
    }

    // 3. Validate request body
    const body = await request.json();
    const validated = productFormSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid product payload", details: validated.error.format() },
        { status: 400 }
      );
    }

    const data = validated.data;

    // 4. Compare changes to check if status needs to revert to pending
    const titleChanged = existingProduct.title !== data.title;
    const priceChanged = existingProduct.price !== data.price;
    const imagesChanged = JSON.stringify(existingProduct.images) !== JSON.stringify(data.images);

    let status = existingProduct.status;
    let message = "Product updated successfully.";

    // If key marketing attributes (title, price, images) change, revert status to 'pending'
    if (titleChanged || priceChanged || imagesChanged) {
      status = "pending";
      message = "Product updated successfully. Changes to title, price, or images require re-approval.";
    }

    // 5. Generate search helpers and slug
    const titleLower = data.title.toLowerCase();
    
    const cleanWord = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    const words = [
      ...data.title.split(/\s+/).map(cleanWord),
      ...data.brand.split(/\s+/).map(cleanWord),
      cleanWord(data.category),
    ].filter((w) => w.length > 2);
    const keywords = Array.from(new Set(words));

    // Update fields
    const updatedProduct: Partial<Product> = {
      title: data.title,
      description: data.description,
      category: data.category,
      brand: data.brand,
      gender: data.gender,
      price: data.price,
      comparePrice: data.comparePrice,
      variants: data.variants,
      images: data.images,
      attributes: {
        fit: data.attributes.fit,
        fabric: data.attributes.fabric,
        occasion: data.attributes.occasion || [],
      },
      status,
      titleLower,
      keywords,
      updatedAt: Date.now(),
    };

    // If title changed, update slug
    if (titleChanged) {
      const slugify = (text: string) =>
        text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      updatedProduct.slug = `${slugify(data.title)}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // 6. Save update
    await prodRef.update(updatedProduct);

    return NextResponse.json({
      success: true,
      productId,
      status,
      message,
    });
  } catch (error: any) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while updating product." },
      { status: 500 }
    );
  }
}

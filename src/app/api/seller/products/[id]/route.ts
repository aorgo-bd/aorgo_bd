import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/firebase/server-auth";
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
    const { uid, role } = await verifyRequestUser(request);

    // 2. Fetch Product from db to verify ownership
    const prodRef = adminDb.collection("products").doc(productId);
    const prodSnap = await prodRef.get();
    if (!prodSnap.exists) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const existingProduct = prodSnap.data() as Product;

    // Verify ownership (or admin status)
    const isOwner = existingProduct.sellerUid === uid;
    const isAdmin = role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You do not own this product." }, { status: 403 });
    }

    if (!isAdmin) {
      const storeSnap = await adminDb.collection("stores").doc(existingProduct.storeId).get();
      const storeData = storeSnap.data();
      if (!storeSnap.exists || storeData?.status !== "approved") {
        return NextResponse.json({ error: "Your store must be approved before editing products." }, { status: 403 });
      }
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
    
    // Generate keywords: [...title.toLowerCase().split(' '), brand.toLowerCase(), category, color, ...sizes].slice(0, 30)
    const titleTokens = data.title.toLowerCase().split(" ");
    const brandToken = data.brand.toLowerCase();
    const categoryToken = data.category;
    const colors = Array.from(new Set(data.variants.map((v) => v.color.toLowerCase())));
    const sizes = Array.from(new Set(data.variants.map((v) => v.size.toLowerCase())));

    const rawKeywords = [
      ...titleTokens,
      brandToken,
      categoryToken,
      ...colors,
      ...sizes
    ].map((w) => w.trim()).filter(Boolean);

    const keywords = Array.from(new Set(rawKeywords)).slice(0, 30);

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

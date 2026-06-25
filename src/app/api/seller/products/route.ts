import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { productFormSchema } from "@/lib/schemas";
import { Product } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
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

    // 2. Fetch User Profile
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }
    const userData = userSnap.data();

    // Guard role
    if (userData?.role !== "seller" && userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Only sellers can create products." }, { status: 403 });
    }

    if (!userData?.storeId) {
      return NextResponse.json({ error: "Store not registered for this user." }, { status: 400 });
    }

    const storeId = userData.storeId;

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

    // Generate slug from title
    const slugify = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    
    // Append a short random string to product slug to avoid overlap
    const slug = `${slugify(data.title)}-${Math.random().toString(36).substring(2, 6)}`;

    const newProduct: Omit<Product, "id"> = {
      storeId,
      sellerUid: uid,
      title: data.title,
      slug,
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
      status: "pending", // Initial status is pending approval
      rating: 0,
      reviewCount: 0,
      totalSold: 0,
      titleLower,
      keywords,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 5. Database transaction: Create product and increment total products
    const productId = adminDb.collection("products").doc().id;

    await adminDb.runTransaction(async (transaction) => {
      const prodRef = adminDb.collection("products").doc(productId);
      const storeRef = adminDb.collection("stores").doc(storeId);

      // Save product
      transaction.set(prodRef, newProduct);

      // Increment store product count
      transaction.update(storeRef, {
        totalProducts: FieldValue.increment(1),
        updatedAt: Date.now(),
      });
    });

    return NextResponse.json({
      success: true,
      productId,
      message: "Product created successfully and is pending approval.",
    });
  } catch (error: any) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while creating product." },
      { status: 500 }
    );
  }
}

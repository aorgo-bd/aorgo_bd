import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/firebase/server-auth";
import { reviewSchema } from "@/lib/schemas";
import { Order, Product, Review } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { uid } = await verifyRequestUser(request);

    // 2. Validate request body
    const body = await request.json();
    const validated = reviewSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { productId, orderId, rating, text, photos } = validated.data;

    // 3. Execute Firestore Transaction to verify, write review, and update product rating
    const reviewId = `${orderId}_${productId}`;
    
    await adminDb.runTransaction(async (transaction) => {
      // Collect references
      const orderRef = adminDb.collection("orders").doc(orderId);
      const productRef = adminDb.collection("products").doc(productId);
      const reviewRef = adminDb.collection("reviews").doc(reviewId);

      // A. Fetch documents first (All reads must happen before writes)
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) {
        throw new Error("Order not found.");
      }
      const orderData = orderSnap.data() as Order;

      // Verify ownership & order status
      if (orderData.customerUid !== uid) {
        throw new Error("You do not own this order.");
      }
      if (orderData.status !== "delivered") {
        throw new Error("You can only review items from delivered orders.");
      }

      // Verify the product was actually purchased in this order
      const hasItem = orderData.items.some((item) => item.productId === productId);
      if (!hasItem) {
        throw new Error("This product was not purchased in this order.");
      }

      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists) {
        throw new Error("Product not found.");
      }
      const productData = productSnap.data() as Product;

      // Verify if review already exists
      const reviewSnap = await transaction.get(reviewRef);
      if (reviewSnap.exists) {
        throw new Error("You have already reviewed this product for this order.");
      }

      // B. Compute new ratings
      const oldReviewCount = productData.reviewCount || 0;
      const oldRating = productData.rating || 0;
      const newReviewCount = oldReviewCount + 1;
      
      // Calculate average rating
      const calculatedRating = (oldRating * oldReviewCount + rating) / newReviewCount;
      const newRating = Math.round(calculatedRating * 100) / 100; // Round to 2 decimal places

      // C. Perform DB writes
      const newReview: Review = {
        id: reviewId,
        productId,
        customerUid: uid,
        customerName: orderData.customerName || "Verified Buyer",
        orderId,
        rating,
        text,
        photos,
        verified: true,
        createdAt: Date.now(),
      };

      // Set the review doc
      transaction.set(reviewRef, newReview);

      // Update the product rating and review count
      transaction.update(productRef, {
        rating: newRating,
        reviewCount: newReviewCount,
        updatedAt: Date.now(),
      });
    });

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully.",
    });

  } catch (error: any) {
    console.error("Review creation failed:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while submitting your review." },
      { status: 400 }
    );
  }
}

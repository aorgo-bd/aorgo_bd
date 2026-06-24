import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { sellerRegisterSchema } from "@/lib/schemas";
import { Store } from "@/lib/types";

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

    // 2. Validate request body
    const body = await request.json();
    const validated = sellerRegisterSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid registration data", details: validated.error.format() },
        { status: 400 }
      );
    }

    const data = validated.data;

    // 3. Uniqueness check for store slug
    const storesRef = adminDb.collection("stores");
    const slugQuery = await storesRef.where("slug", "==", data.slug).get();
    if (!slugQuery.empty) {
      return NextResponse.json(
        { error: "A store with this slug already exists. Please choose a different name." },
        { status: 400 }
      );
    }

    // 4. Check if user already has a store
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    const userData = userSnap.data();
    if (userData?.storeId) {
      return NextResponse.json(
        { error: "You are already registered as a seller with store ID " + userData.storeId },
        { status: 400 }
      );
    }

    // 5. Generate store ID
    const storeId = storesRef.doc().id;

    const newStore: Store = {
      id: storeId,
      ownerUid: uid,
      name: data.name,
      slug: data.slug,
      description: data.description,
      status: "pending",
      tradeLicenseUrl: data.tradeLicenseUrl,
      nidUrl: data.nidUrl,
      bankDetails: {
        accountName: data.bankDetails.accountName,
        accountNumber: data.bankDetails.accountNumber,
        bankName: data.bankDetails.bankName,
        branchName: data.bankDetails.branchName,
        routingNumber: data.bankDetails.routingNumber || "",
      },
      contact: {
        email: data.contactEmail,
        phone: data.contactPhone,
      },
      commissionRate: 0.10, // 10% commission default for MVP
      rating: 0,
      reviewCount: 0,
      totalSales: 0,
      totalProducts: 0,
      createdAt: Date.now(),
    };

    // 6. Database Transaction to create store and update user
    await adminDb.runTransaction(async (transaction) => {
      // Set store
      const newStoreRef = storesRef.doc(storeId);
      transaction.set(newStoreRef, newStore);

      // Update user
      transaction.update(userRef, {
        role: "seller",
        storeId: storeId,
        updatedAt: Date.now(),
      });
    });

    // 7. Return success and update cookies
    const response = NextResponse.json({
      success: true,
      storeId,
      message: "Seller registration submitted successfully. Your store is pending approval.",
    });

    // Set the user-role cookie to seller immediately for navigation
    response.cookies.set("user-role", "seller", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Seller registration failed:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during seller registration." },
      { status: 500 }
    );
  }
}

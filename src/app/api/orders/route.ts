import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/firebase/server-auth";
import { checkoutPayloadSchema } from "@/lib/schemas";
import { Order, OrderItem, Product, Store } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { uid } = await verifyRequestUser(request);

    // 2. Validate request body
    const body = await request.json();
    const validated = checkoutPayloadSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { items, shippingAddress } = validated.data;

    // 3. Execute Firestore Transaction
    const result = await adminDb.runTransaction(async (transaction) => {
      // Collect unique product IDs and store IDs
      const uniqueProductIds = Array.from(new Set(items.map((item) => item.productId)));
      
      // A. Fetch all products first (ALL READS MUST BE FIRST)
      const productDocs: { [id: string]: Product } = {};
      const productRefs: { [id: string]: any } = {};

      for (const productId of uniqueProductIds) {
        const productRef = adminDb.collection("products").doc(productId);
        const docSnap = await transaction.get(productRef);
        if (!docSnap.exists) {
          throw new Error(`Product with ID ${productId} does not exist.`);
        }
        const prodData = docSnap.data() as Product;
        if (prodData.status !== "approved") {
          throw new Error(`Product "${prodData.title}" is not available for purchase.`);
        }
        productDocs[productId] = { ...prodData, id: docSnap.id };
        productRefs[productId] = productRef;
      }

      // Collect unique store IDs from the loaded products
      const uniqueStoreIds = Array.from(
        new Set(Object.values(productDocs).map((p) => p.storeId))
      );

      // B. Fetch all stores (READS)
      const storeDocs: { [id: string]: Store } = {};
      for (const storeId of uniqueStoreIds) {
        const storeRef = adminDb.collection("stores").doc(storeId);
        const docSnap = await transaction.get(storeRef);
        if (!docSnap.exists) {
          throw new Error(`Store with ID ${storeId} does not exist.`);
        }
        const storeData = docSnap.data() as Store;
        if (storeData.status !== "approved") {
          throw new Error(`Store "${storeData.name}" is currently suspended or inactive.`);
        }
        storeDocs[storeId] = { ...storeData, id: docSnap.id };
      }

      // Check if it's the customer's first order
      const customerOrdersSnap = await transaction.get(
        adminDb.collection("orders").where("customerUid", "==", uid).limit(1)
      );
      const isFirstOrder = customerOrdersSnap.empty;

      // C. Stock Verification and Totals Recomputation
      // Group checkout items by store to create separated orders
      const itemsByStore: {
        [storeId: string]: {
          item: typeof items[0];
          product: Product;
          variant: Product["variants"][0];
        }[];
      } = {};

      // Keep track of stock reductions per product variant sku to check multiple item occurrences of same variant
      const requestedStockBySku: { [sku: string]: number } = {};
      for (const item of items) {
        requestedStockBySku[item.variantSku] = (requestedStockBySku[item.variantSku] || 0) + item.qty;
      }

      for (const item of items) {
        const product = productDocs[item.productId];
        const variant = product.variants?.find((v) => v.sku === item.variantSku);

        if (!variant) {
          throw new Error(`Variant SKU ${item.variantSku} not found for product "${product.title}".`);
        }

        const totalRequested = requestedStockBySku[item.variantSku];
        if (variant.stock < totalRequested) {
          throw new Error(
            `Insufficient stock for "${product.title}" (${variant.color}, ${variant.size}). Requested: ${totalRequested}, Available: ${variant.stock}`
          );
        }

        if (!itemsByStore[product.storeId]) {
          itemsByStore[product.storeId] = [];
        }
        itemsByStore[product.storeId].push({ item, product, variant });
      }

      // D. Prepare Orders and Stock Updates (ALL WRITES MUST BE LAST)
      const createdOrders: Order[] = [];
      const productStockUpdates: { [productId: string]: Product["variants"] } = {};
      const productTotalSoldUpdates: { [productId: string]: number } = {};

      for (const storeId of Object.keys(itemsByStore)) {
        const store = storeDocs[storeId];
        const storeGroup = itemsByStore[storeId];

        // Recompute subtotal using canonical product price
        const subtotal = storeGroup.reduce(
          (sum, g) => sum + g.product.price * g.item.qty,
          0
        );

        // Shipping fee logic: free shipping if store order subtotal > 3000, OR first order over 1500, otherwise 100
        const shippingFee = (subtotal > 3000 || (isFirstOrder && subtotal > 1500)) ? 0 : 100;
        const total = subtotal + shippingFee; // COD discount = 0 for MVP

        const orderId = adminDb.collection("orders").doc().id;
        const addressId = adminDb.collection("orders").doc().id;

        const orderItems: OrderItem[] = storeGroup.map((g) => {
          // Track updates to products
          if (!productStockUpdates[g.product.id]) {
            productStockUpdates[g.product.id] = [...g.product.variants];
            productTotalSoldUpdates[g.product.id] = g.product.totalSold || 0;
          }

          // Decrement variants array stock inside productStockUpdates
          productStockUpdates[g.product.id] = productStockUpdates[g.product.id].map((v) => {
            if (v.sku === g.variant.sku) {
              return { ...v, stock: v.stock - g.item.qty };
            }
            return v;
          });

          // Increment product totalSold count
          productTotalSoldUpdates[g.product.id] += g.item.qty;

          return {
            productId: g.product.id,
            variantSku: g.variant.sku,
            title: g.product.title,
            imagePublicId: g.product.images[0] || "",
            size: g.variant.size,
            color: g.variant.color,
            qty: g.item.qty,
            priceAtPurchase: g.product.price, // canonical price recomputed
          };
        });

        const orderDoc: Order = {
          id: orderId,
          customerUid: uid,
          customerName: shippingAddress.name,
          customerPhone: shippingAddress.phone,
          storeId: store.id,
          storeOwnerUid: store.ownerUid,
          storeName: store.name,
          items: orderItems,
          shippingAddress: {
            id: addressId,
            ...shippingAddress,
          },
          payment: {
            method: "cod",
            status: "pending",
          },
          shipping: {
            fee: shippingFee,
          },
          totals: {
            subtotal,
            shipping: shippingFee,
            discount: 0,
            total,
          },
          status: "pending",
          statusHistory: [
            {
              status: "pending",
              at: Date.now(),
              by: "customer",
              note: "Order placed via Cash on Delivery.",
            },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        createdOrders.push(orderDoc);
      }

      // E. Perform Database Writes
      // Update product stocks & totalSold
      for (const productId of Object.keys(productStockUpdates)) {
        const productRef = productRefs[productId];
        transaction.update(productRef, {
          variants: productStockUpdates[productId],
          totalSold: productTotalSoldUpdates[productId],
          updatedAt: Date.now(),
        });
      }

      // Create order documents
      for (const order of createdOrders) {
        const orderRef = adminDb.collection("orders").doc(order.id);
        transaction.set(orderRef, order);

        // Audit trail for each created order (matches admin-route pattern)
        const auditRef = adminDb.collection("audit_logs").doc();
        transaction.set(auditRef, {
          id: auditRef.id,
          actorUid: uid,
          actorRole: "customer",
          action: "order.create",
          entity: "order",
          entityId: order.id,
          after: { storeId: order.storeId, total: order.totals.total },
          at: Date.now(),
        });
      }

      return createdOrders;
    });

    // 4. Return response
    const firstOrderId = result[0]?.id || "";
    const orderIds = result.map((o) => o.id);

    return NextResponse.json({
      success: true,
      orderId: firstOrderId,
      orderIds,
    });
  } catch (error: any) {
    console.error("Order processing failed:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while placing your order" },
      { status: 400 }
    );
  }
}

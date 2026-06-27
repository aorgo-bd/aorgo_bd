import { config } from "dotenv";
config({ path: ".env.local" });

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  const b64 = process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64!;
  const sanitizedB64 = b64.replace(/\s/g, '');
  const sa = JSON.parse(
    Buffer.from(sanitizedB64, "base64").toString("utf-8")
  );
  initializeApp({ credential: cert(sa) });
}
const db = getFirestore();

// 1. Define Categories
const categories = [
  { slug: "women", name: "Women", parent: null, order: 1, image: "/images/products/jamdani-saree.webp" },
  { slug: "men", name: "Men", parent: null, order: 2, image: "/images/products/oversized-t-shirt.webp" },
  { slug: "kids", name: "Kids", parent: null, order: 3, image: "/images/products/crop-top.webp" },
  { slug: "footwear", name: "Footwear", parent: null, order: 4, image: "/images/products/silk-saree.webp" },
  { slug: "beauty", name: "Beauty", parent: null, order: 5, image: "/images/products/floral-maxi.webp" },
  { slug: "home", name: "Home", parent: null, order: 6, image: "/images/products/three-piece-salwar-kameez.webp" },
  { slug: "sports", name: "Sports", parent: null, order: 7, image: "/images/products/oversized-t-shirt-2.webp" },
  { slug: "bags", name: "Bags", parent: null, order: 8, image: "/images/products/crop-top-2.webp" },
  { slug: "watches", name: "Watches", parent: null, order: 9, image: "/images/products/jamdani-saree-2.webp" },
  { slug: "sale", name: "Sale", parent: null, order: 10, image: "/images/products/floral-maxi-2.webp" },

  // Subcategories
  { slug: "women-ethnic", name: "Ethnic Wear", parent: "women", order: 1 },
  { slug: "women-dresses", name: "Dresses", parent: "women", order: 2 },
  { slug: "women-tops", name: "Western Tops", parent: "women", order: 3 },
  { slug: "women-bottoms", name: "Bottoms", parent: "women", order: 4 },
  { slug: "men-tops", name: "Tops", parent: "men", order: 1 },
  { slug: "men-ethnic", name: "Ethnic Wear", parent: "men", order: 2 },
  { slug: "men-bottoms", name: "Bottoms", parent: "men", order: 3 },
  { slug: "footwear-men", name: "Men's Footwear", parent: "footwear", order: 1 },
  { slug: "footwear-women", name: "Women's Footwear", parent: "footwear", order: 2 }
];

// 2. Define Stores
const stores = [
  {
    id: "demo-store-1",
    ownerUid: "demo-seller-1",
    name: "Aarong",
    slug: "aarong",
    description: "Premium Bangladeshi heritage fashion and lifestyle edits.",
    status: "approved",
    rating: 4.8,
    reviewCount: 120,
    totalSales: 890000,
    totalProducts: 4,
    contact: { email: "aarong@aorgo.com.bd", phone: "+8801700000001" },
    commissionRate: 0.10,
    createdAt: Date.now()
  },
  {
    id: "demo-store-2",
    ownerUid: "demo-seller-2",
    name: "Yellow",
    slug: "yellow",
    description: "Contemporary fashion clothing and accessories for trendsetters.",
    status: "approved",
    rating: 4.6,
    reviewCount: 95,
    totalSales: 670000,
    totalProducts: 3,
    contact: { email: "yellow@aorgo.com.bd", phone: "+8801700000002" },
    commissionRate: 0.12,
    createdAt: Date.now()
  },
  {
    id: "demo-store-3",
    ownerUid: "demo-seller-3",
    name: "Sailor",
    slug: "sailor",
    description: "Sailor is a prominent lifestyle fashion brand in Bangladesh.",
    status: "approved",
    rating: 4.5,
    reviewCount: 48,
    totalSales: 320000,
    totalProducts: 2,
    contact: { email: "sailor@aorgo.com.bd", phone: "+8801700000003" },
    commissionRate: 0.10,
    createdAt: Date.now()
  },
  {
    id: "demo-store-4",
    ownerUid: "demo-seller-4",
    name: "Ecstasy",
    slug: "ecstasy",
    description: "Trend-driven western fashion wear and casual lifestyle pieces.",
    status: "approved",
    rating: 4.4,
    reviewCount: 30,
    totalSales: 190000,
    totalProducts: 2,
    contact: { email: "ecstasy@aorgo.com.bd", phone: "+8801700000004" },
    commissionRate: 0.15,
    createdAt: Date.now()
  }
];

// 3. Define 10 Products matching the attached photos
const products = [
  {
    title: "Premium Jamdani Cotton Saree",
    category: "women-ethnic",
    storeId: "demo-store-1",
    brand: "Aarong",
    gender: "women",
    price: 2499,
    comparePrice: 3499,
    fabric: "Cotton Jamdani",
    occasion: ["Festive", "Eid"],
    images: ["/images/products/jamdani-saree.webp"],
    description: "Intricately handwoven Jamdani cotton saree with classic geometric patterns. Breathable fabric customized for premium style and tradition."
  },
  {
    title: "Royal Crimson Jamdani Saree",
    category: "women-ethnic",
    storeId: "demo-store-1",
    brand: "Aarong",
    gender: "women",
    price: 3500,
    comparePrice: 4800,
    fabric: "Half Silk Jamdani",
    occasion: ["Festive", "Wedding"],
    images: ["/images/products/jamdani-saree-2.webp"],
    description: "A gorgeous crimson half-silk Jamdani saree featuring gold zari details, making it the perfect focal point for any festive wedding collection."
  },
  {
    title: "Eid Collection Premium Silk Saree",
    category: "women-ethnic",
    storeId: "demo-store-1",
    brand: "Aarong",
    gender: "women",
    price: 5500,
    comparePrice: 7500,
    fabric: "Pure Silk",
    occasion: ["Eid", "Wedding Collection"],
    images: ["/images/products/silk-saree.webp"],
    description: "Luxury wedding and Eid collection pure silk saree with high-fidelity embroidery details along the border and pallu. Includes matching blouse piece."
  },
  {
    title: "Three Piece Salwar Kameez Suit",
    category: "women-ethnic",
    storeId: "demo-store-2",
    brand: "Yellow",
    gender: "women",
    price: 4200,
    comparePrice: 5900,
    fabric: "Georgette & Cotton",
    occasion: ["Eid", "Party"],
    images: ["/images/products/three-piece-salwar-kameez.webp"],
    description: "A trendy georgette salwar kameez 3-piece suit with an embroidered neckline, premium cotton pants, and a matching soft chiffon dupatta."
  },
  {
    title: "Minimalist Ribbed Crop Top",
    category: "women-tops",
    storeId: "demo-store-4",
    brand: "Ecstasy",
    gender: "women",
    price: 1250,
    comparePrice: 1850,
    fabric: "Cotton Ribbed Knit",
    occasion: ["Casual", "Hangout"],
    images: ["/images/products/crop-top.webp"],
    description: "Comfortable rib-knit crop top in clean, minimalist design. Features a high neckline and soft stretching fit, ideal for summer styling."
  },
  {
    title: "Casual Western Pastel Crop Top",
    category: "women-tops",
    storeId: "demo-store-4",
    brand: "Ecstasy",
    gender: "women",
    price: 1150,
    comparePrice: 1650,
    fabric: "Viscose Blend",
    occasion: ["Casual", "Vacation"],
    images: ["/images/products/crop-top-2.webp"],
    description: "A casual western crop top in a beautiful pastel shade, offering a lightweight and breezy silhouette perfect for beach days or hangouts."
  },
  {
    title: "Smocked Floral Georgette Maxi",
    category: "women-dresses",
    storeId: "demo-store-3",
    brand: "Sailor",
    gender: "women",
    price: 2800,
    comparePrice: 3950,
    fabric: "Chiffon Georgette",
    occasion: ["Casual", "Dinner"],
    images: ["/images/products/floral-maxi.webp"],
    description: "Bohemian georgette maxi dress featuring a vivid floral print, smocked waistline, tiered skirt, and balloon sleeves for a whimsical design."
  },
  {
    title: "Tiered Floral Garden Maxi Dress",
    category: "women-dresses",
    storeId: "demo-store-3",
    brand: "Sailor",
    gender: "women",
    price: 2999,
    comparePrice: 4200,
    fabric: "Chiffon Georgette",
    occasion: ["Casual", "Vacation"],
    images: ["/images/products/floral-maxi-2.webp"],
    description: "A beautiful tiered garden maxi dress with delicate floral overlays, featuring soft internal lining and a breathable flowy fit."
  },
  {
    title: "Oversized Heavyweight Cotton Tee",
    category: "men-tops",
    storeId: "demo-store-2",
    brand: "Yellow",
    gender: "unisex",
    price: 990,
    comparePrice: 1490,
    fabric: "240 GSM Cotton",
    occasion: ["Casual", "Streetwear"],
    images: ["/images/products/oversized-t-shirt.webp"],
    description: "A relaxed, oversized heavyweight cotton t-shirt in drop-shoulder style. High-density knit built for extreme daily wear durability."
  },
  {
    title: "Streetwear Printed Oversized Tee",
    category: "men-tops",
    storeId: "demo-store-2",
    brand: "Yellow",
    gender: "unisex",
    price: 1050,
    comparePrice: 1550,
    fabric: "240 GSM Cotton",
    occasion: ["Casual", "Streetwear"],
    images: ["/images/products/oversized-t-shirt-2.webp"],
    description: "A premium streetwear print oversized t-shirt, constructed with thick pre-shrunk cotton fabric and featuring graphic logo placements."
  }
];

// 4. Define Banners
const banners = [
  {
    id: "banner-1",
    title: "EID CELEBRATION STYLES",
    subtitle: "Get up to 50% off on premium heritage cotton and silk jamdani sarees.",
    imagePublicId: "/images/banners/banner-1.webp",
    ctaUrl: "/category/women",
    position: "hero",
    active: true,
    order: 1
  },
  {
    id: "banner-2",
    title: "VIBRANT STREETWEAR DEALS",
    subtitle: "Upgrade your casual edits with heavyweight oversized tees and top crops.",
    imagePublicId: "/images/banners/banner-2.webp",
    ctaUrl: "/category/men",
    position: "hero",
    active: true,
    order: 2
  }
];

async function deleteCollection(collectionPath: string) {
  const collectionRef = db.collection(collectionPath);
  const snap = await collectionRef.get();
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`🧹 Cleared collection: ${collectionPath}`);
}

async function seed() {
  console.log("🌱 Starting AORGO Custom Myntra Seeding...");

  // Clear existing catalog data
  await deleteCollection("products");
  await deleteCollection("banners");
  await deleteCollection("categories");
  await deleteCollection("stores");

  // A. Seed Categories
  console.log("📂 Seeding categories...");
  for (const cat of categories) {
    await db.collection("categories").doc(cat.slug).set({
      slug: cat.slug,
      name: cat.name,
      parent: cat.parent,
      order: cat.order || 99,
      image: cat.image || null,
      productCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
  console.log(`   ✅ Seeded ${categories.length} categories.`);

  // B. Seed Stores
  console.log("🏪 Seeding stores...");
  for (const store of stores) {
    await db.collection("stores").doc(store.id).set(store);
  }
  console.log(`   ✅ Seeded ${stores.length} stores.`);

  // C. Seed Products
  console.log("🛍️ Seeding products...");
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const id = `product-${i + 1}`;
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + `-${id}`;
    
    const productDoc = {
      id,
      storeId: p.storeId,
      sellerUid: stores.find((s) => s.id === p.storeId)?.ownerUid || "demo-seller-1",
      title: p.title,
      slug,
      description: p.description,
      category: p.category,
      brand: p.brand,
      gender: p.gender as "women" | "men" | "unisex",
      price: p.price,
      comparePrice: p.comparePrice,
      discountPercent: Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100),
      variants: ["S", "M", "L", "XL"].map((size) => ({
        sku: `${id}-${size}`,
        size,
        color: "Default",
        stock: 50
      })),
      images: p.images,
      attributes: {
        fabric: p.fabric,
        occasion: p.occasion,
        fit: "regular"
      },
      status: "approved" as const,
      featured: i % 2 === 0,
      rating: 4.5,
      reviewCount: 15,
      totalSold: 42,
      titleLower: p.title.toLowerCase(),
      keywords: [
        ...p.title.toLowerCase().split(" "),
        p.brand.toLowerCase(),
        p.category,
        ...p.occasion.map((o) => o.toLowerCase())
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await db.collection("products").doc(id).set(productDoc);
  }
  console.log(`   ✅ Seeded ${products.length} products.`);

  // D. Seed Banners
  console.log("🎬 Seeding banners...");
  const batch = db.batch();
  for (const banner of banners) {
    batch.set(db.collection("banners").doc(banner.id), {
      ...banner,
      createdAt: Date.now()
    });
  }
  await batch.commit();
  console.log(`   ✅ Seeded ${banners.length} banners.`);

  console.log("\n🎉 AORGO Myntra Seeding completed successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  });

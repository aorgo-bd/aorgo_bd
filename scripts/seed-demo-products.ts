import { config } from "dotenv";
config({ path: ".env.local" });

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  const sa = JSON.parse(
    Buffer.from(process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64!, "base64").toString("utf-8")
  );
  initializeApp({ credential: cert(sa) });
}
const db = getFirestore();

// 1. Define Stores
const stores = [
  {
    id: "demo-store-1",
    ownerUid: "demo-seller-1",
    name: "Aarong (Demo)",
    slug: "aarong",
    description: "Premium Bangladeshi heritage fashion and lifestyle edits.",
    status: "approved",
    rating: 4.6,
    reviewCount: 15,
    totalSales: 450000,
    totalProducts: 12,
    contact: { email: "aarong@demo.aorgo.com.bd", phone: "+8801700000001" },
    commissionRate: 0.10,
    createdAt: Date.now()
  },
  {
    id: "demo-store-2",
    ownerUid: "demo-seller-2",
    name: "Yellow (Demo)",
    slug: "yellow",
    description: "Contemporary fashion clothing and accessories for trendsetters.",
    status: "approved",
    rating: 4.4,
    reviewCount: 22,
    totalSales: 350000,
    totalProducts: 9,
    contact: { email: "yellow@demo.aorgo.com.bd", phone: "+8801700000002" },
    commissionRate: 0.12,
    createdAt: Date.now()
  },
  {
    id: "demo-store-3",
    ownerUid: "demo-seller-3",
    name: "Sailor (Demo)",
    slug: "sailor",
    description: "Sailor is a prominent lifestyle fashion brand in Bangladesh.",
    status: "approved",
    rating: 4.5,
    reviewCount: 10,
    totalSales: 180000,
    totalProducts: 8,
    contact: { email: "sailor@demo.aorgo.com.bd", phone: "+8801700000003" },
    commissionRate: 0.10,
    createdAt: Date.now()
  },
  {
    id: "demo-store-4",
    ownerUid: "demo-seller-4",
    name: "Ecstasy (Demo)",
    slug: "ecstasy",
    description: "Trend-driven western fashion wear and casual lifestyle pieces.",
    status: "approved",
    rating: 4.2,
    reviewCount: 8,
    totalSales: 120000,
    totalProducts: 6,
    contact: { email: "ecstasy@demo.aorgo.com.bd", phone: "+8801700000004" },
    commissionRate: 0.15,
    createdAt: Date.now()
  },
  {
    id: "demo-store-5",
    ownerUid: "demo-seller-5",
    name: "Apex (Demo)",
    slug: "apex",
    description: "Nationwide leading leather footwear and accessory collections.",
    status: "approved",
    rating: 4.7,
    reviewCount: 35,
    totalSales: 890000,
    totalProducts: 10,
    contact: { email: "apex@demo.aorgo.com.bd", phone: "+8801700000005" },
    commissionRate: 0.08,
    createdAt: Date.now()
  }
];

// 2. Define Customers & Admin
const users = [
  {
    uid: "demo-customer-1",
    email: "customer1@aorgo.com.bd",
    displayName: "Rahim Ahmed",
    role: "customer",
    addresses: [
      {
        id: "addr-1",
        name: "Rahim Ahmed",
        phone: "01712345678",
        area: "House 42, Road 11, Banani",
        city: "Dhaka",
        district: "Dhaka",
        postalCode: "1213",
        isDefault: true
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    uid: "demo-customer-2",
    email: "customer2@aorgo.com.bd",
    displayName: "Sadia Rahman",
    role: "customer",
    addresses: [
      {
        id: "addr-2",
        name: "Sadia Rahman",
        phone: "01812345678",
        area: "Apartment 4B, Sector 3, Uttara",
        city: "Dhaka",
        district: "Dhaka",
        postalCode: "1230",
        isDefault: true
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    uid: "xeN4U5u2PuXV3JX2XY5myABPbiX2",
    email: "aorgobd@gmail.com",
    displayName: "AORGO Admin",
    role: "admin",
    addresses: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// 3. Define 36 Products (3 per subcategory)
const products = [
  // --- WOMEN'S TOPS (women-tops) ---
  {
    title: "Embroidered Cotton Kurti",
    category: "women-tops",
    storeId: "demo-store-1", // Aarong
    brand: "Aarong",
    gender: "women",
    price: 1250,
    comparePrice: 1850,
    fabric: "Cotton",
    occasion: ["Casual", "Eid"],
    publicIds: ["aorgo/demo/kurti1"]
  },
  {
    title: "Navy Blue Silk Tunic",
    category: "women-tops",
    storeId: "demo-store-3", // Sailor
    brand: "Sailor",
    gender: "women",
    price: 1850,
    comparePrice: 2450,
    fabric: "Silk",
    occasion: ["Formal", "Party"],
    publicIds: ["aorgo/demo/tunic1"]
  },
  {
    title: "Casual Western White Top",
    category: "women-tops",
    storeId: "demo-store-4", // Ecstasy
    brand: "Ecstasy",
    gender: "women",
    price: 1150,
    comparePrice: 1650,
    fabric: "Georgette",
    occasion: ["Casual", "Hangout"],
    publicIds: ["aorgo/demo/tunic2"]
  },

  // --- WOMEN'S ETHNIC (women-ethnic) ---
  {
    title: "Cotton Jamdani Saree",
    category: "women-ethnic",
    storeId: "demo-store-1", // Aarong
    brand: "Aarong",
    gender: "women",
    price: 2499,
    comparePrice: 3499,
    fabric: "Cotton",
    occasion: ["Eid", "Party"],
    publicIds: ["aorgo/demo/saree1"]
  },
  {
    title: "Half Silk Tangail Saree",
    category: "women-ethnic",
    storeId: "demo-store-1", // Aarong
    brand: "Aarong",
    gender: "women",
    price: 3500,
    comparePrice: 4800,
    fabric: "Silk Blend",
    occasion: ["Eid", "Wedding"],
    publicIds: ["aorgo/demo/saree2"]
  },
  {
    title: "Georgette Salwar Kameez Suit",
    category: "women-ethnic",
    storeId: "demo-store-2", // Yellow
    brand: "Yellow",
    gender: "women",
    price: 4500,
    comparePrice: 5900,
    fabric: "Georgette",
    occasion: ["Party", "Festival"],
    publicIds: ["aorgo/demo/salwar1"]
  },

  // --- WOMEN'S DRESSES (women-dresses) ---
  {
    title: "Red Georgette Maxi Dress",
    category: "women-dresses",
    storeId: "demo-store-4", // Ecstasy
    brand: "Ecstasy",
    gender: "women",
    price: 2800,
    comparePrice: 3950,
    fabric: "Georgette",
    occasion: ["Party", "Dinner"],
    publicIds: ["aorgo/demo/dress1"]
  },
  {
    title: "Floral Print Midi Dress",
    category: "women-dresses",
    storeId: "demo-store-3", // Sailor
    brand: "Sailor",
    gender: "women",
    price: 2200,
    comparePrice: 2990,
    fabric: "Viscose",
    occasion: ["Casual", "Hangout"],
    publicIds: ["aorgo/demo/dress2"]
  },
  {
    title: "Bohemian Cotton A-Line Dress",
    category: "women-dresses",
    storeId: "demo-store-4", // Ecstasy
    brand: "Ecstasy",
    gender: "women",
    price: 1950,
    comparePrice: 2750,
    fabric: "Cotton",
    occasion: ["Casual", "Vacation"],
    publicIds: ["aorgo/demo/dress1"]
  },

  // --- WOMEN'S BOTTOMS (women-bottoms) ---
  {
    title: "High Waist Denim Jeans",
    category: "women-bottoms",
    storeId: "demo-store-4", // Ecstasy
    brand: "Ecstasy",
    gender: "women",
    price: 1850,
    comparePrice: 2650,
    fabric: "Denim",
    occasion: ["Casual", "Hangout"],
    publicIds: ["aorgo/demo/pants1"]
  },
  {
    title: "Premium Palazzo Pants Black",
    category: "women-bottoms",
    storeId: "demo-store-1", // Aarong
    brand: "Aarong",
    gender: "women",
    price: 950,
    comparePrice: 1350,
    fabric: "Cotton",
    occasion: ["Casual", "Home"],
    publicIds: ["aorgo/demo/pants2"]
  },
  {
    title: "Cotton Leggings Pack of 2",
    category: "women-bottoms",
    storeId: "demo-store-3", // Sailor
    brand: "Sailor",
    gender: "women",
    price: 850,
    comparePrice: 1100,
    fabric: "Cotton Lycra",
    occasion: ["Casual", "Home"],
    publicIds: ["aorgo/demo/pants1"]
  },

  // --- WOMEN'S WINTER (women-winter) ---
  {
    title: "Embroidered Knitted Shawl",
    category: "women-winter",
    storeId: "demo-store-1", // Aarong
    brand: "Aarong",
    gender: "women",
    price: 1999,
    comparePrice: 2899,
    fabric: "Wool",
    occasion: ["Casual", "Winter-Festival"],
    publicIds: ["aorgo/demo/shawl1"]
  },
  {
    title: "Cashmere Blend Cardigan",
    category: "women-winter",
    storeId: "demo-store-2", // Yellow
    brand: "Yellow",
    gender: "women",
    price: 2999,
    comparePrice: 4200,
    fabric: "Cashmere Blend",
    occasion: ["Casual", "Hangout"],
    publicIds: ["aorgo/demo/jacket1"]
  },
  {
    title: "Hooded Parka Jacket",
    category: "women-winter",
    storeId: "demo-store-4", // Ecstasy
    brand: "Ecstasy",
    gender: "women",
    price: 4200,
    comparePrice: 5900,
    fabric: "Polyester",
    occasion: ["Winter-Trip", "Casual"],
    publicIds: ["aorgo/demo/jacket2"]
  },

  // --- MEN'S TOPS (men-tops) ---
  {
    title: "Casual Cotton Shirt Olive Green",
    category: "men-tops",
    storeId: "demo-store-2", // Yellow
    brand: "Yellow",
    gender: "men",
    price: 1499,
    comparePrice: 2199,
    fabric: "Cotton",
    occasion: ["Casual", "Office"],
    publicIds: ["aorgo/demo/shirt1"]
  },
  {
    title: "Pique Cotton Polo Navy",
    category: "men-tops",
    storeId: "demo-store-3", // Sailor
    brand: "Sailor",
    gender: "men",
    price: 999,
    comparePrice: 1450,
    fabric: "Cotton Pique",
    occasion: ["Casual", "Hangout"],
    publicIds: ["aorgo/demo/polo1"]
  },
  {
    title: "Graphic Print Cotton Tee",
    category: "men-tops",
    storeId: "demo-store-4", // Ecstasy
    brand: "Ecstasy",
    gender: "men",
    price: 750,
    comparePrice: 1100,
    fabric: "Cotton",
    occasion: ["Casual", "Hangout"],
    publicIds: ["aorgo/demo/tshirt1"]
  },

  // --- MEN'S BOTTOMS (men-bottoms) ---
  {
    title: "Slim Fit Chino Pants Tan",
    category: "men-bottoms",
    storeId: "demo-store-2", // Yellow
    brand: "Yellow",
    gender: "men",
    price: 1899,
    comparePrice: 2599,
    fabric: "Cotton Twill",
    occasion: ["Casual", "Office"],
    publicIds: ["aorgo/demo/pants1"]
  },
  {
    title: "Premium Denim Jeans Blue",
    category: "men-bottoms",
    storeId: "demo-store-3", // Sailor
    brand: "Sailor",
    gender: "men",
    price: 2499,
    comparePrice: 3499,
    fabric: "Denim",
    occasion: ["Casual", "Hangout"],
    publicIds: ["aorgo/demo/pants2"]
  },
  {
    title: "Cargo Joggers Pants",
    category: "men-bottoms",
    storeId: "demo-store-4", // Ecstasy
    brand: "Ecstasy",
    gender: "men",
    price: 1690,
    comparePrice: 2290,
    fabric: "Cotton Blend",
    occasion: ["Casual", "Hangout"],
    publicIds: ["aorgo/demo/pants1"]
  },

  // --- MEN'S ETHNIC (men-ethnic) ---
  {
    title: "Premium Cotton Punjabi",
    category: "men-ethnic",
    storeId: "demo-store-2", // Yellow
    brand: "Yellow",
    gender: "men",
    price: 1899,
    comparePrice: 2599,
    fabric: "Cotton",
    occasion: ["Eid", "Jummah"],
    publicIds: ["aorgo/demo/punjabi1"]
  },
  {
    title: "Handloom Silk Punjabi",
    category: "men-ethnic",
    storeId: "demo-store-1", // Aarong
    brand: "Aarong",
    gender: "men",
    price: 3200,
    comparePrice: 4500,
    fabric: "Silk",
    occasion: ["Eid", "Wedding"],
    publicIds: ["aorgo/demo/punjabi1"]
  },
  {
    title: "Classic Kabli Suit Navy",
    category: "men-ethnic",
    storeId: "demo-store-3", // Sailor
    brand: "Sailor",
    gender: "men",
    price: 4500,
    comparePrice: 5800,
    fabric: "Cotton Blend",
    occasion: ["Eid", "Festival"],
    publicIds: ["aorgo/demo/punjabi1"]
  },

  // --- MEN'S WINTER (men-winter) ---
  {
    title: "Fleece Bomber Jacket Black",
    category: "men-winter",
    storeId: "demo-store-2", // Yellow
    brand: "Yellow",
    gender: "men",
    price: 2999,
    comparePrice: 4200,
    fabric: "Fleece",
    occasion: ["Casual", "Hangout"],
    publicIds: ["aorgo/demo/jacket1"]
  },
  {
    title: "Premium Woolen Sweater",
    category: "men-winter",
    storeId: "demo-store-3", // Sailor
    brand: "Sailor",
    gender: "men",
    price: 2199,
    comparePrice: 2999,
    fabric: "Wool",
    occasion: ["Casual", "Office"],
    publicIds: ["aorgo/demo/jacket2"]
  },
  {
    title: "Windproof Hooded Windbreaker",
    category: "men-winter",
    storeId: "demo-store-4", // Ecstasy
    brand: "Ecstasy",
    gender: "men",
    price: 1850,
    comparePrice: 2450,
    fabric: "Nylon",
    occasion: ["Casual", "Trip"],
    publicIds: ["aorgo/demo/jacket1"]
  },

  // --- MEN'S FOOTWEAR (footwear-men) ---
  {
    title: "Handcrafted Leather Loafers",
    category: "footwear-men",
    storeId: "demo-store-5", // Apex
    brand: "Apex",
    gender: "men",
    price: 3800,
    comparePrice: 4999,
    fabric: "Leather",
    occasion: ["Formal", "Party"],
    publicIds: ["aorgo/demo/shoe1"]
  },
  {
    title: "Casual Canvas Sneakers",
    category: "footwear-men",
    storeId: "demo-store-5", // Apex
    brand: "Apex",
    gender: "men",
    price: 1999,
    comparePrice: 2799,
    fabric: "Canvas",
    occasion: ["Casual", "Hangout"],
    publicIds: ["aorgo/demo/shoe2"]
  },
  {
    title: "Premium Leather Oxford Shoes",
    category: "footwear-men",
    storeId: "demo-store-5", // Apex
    brand: "Apex",
    gender: "men",
    price: 5200,
    comparePrice: 6500,
    fabric: "Leather",
    occasion: ["Formal", "Wedding"],
    publicIds: ["aorgo/demo/shoe1"]
  },

  // --- WOMEN'S FOOTWEAR (footwear-women) ---
  {
    title: "Flat Leather Sandals Gold",
    category: "footwear-women",
    storeId: "demo-store-5", // Apex
    brand: "Apex",
    gender: "women",
    price: 1490,
    comparePrice: 1990,
    fabric: "Leather",
    occasion: ["Casual", "Eid"],
    publicIds: ["aorgo/demo/shoe2"]
  },
  {
    title: "Block Heel Party Pumps",
    category: "footwear-women",
    storeId: "demo-store-5", // Apex
    brand: "Apex",
    gender: "women",
    price: 2800,
    comparePrice: 3800,
    fabric: "Synthetic Leather",
    occasion: ["Party", "Wedding"],
    publicIds: ["aorgo/demo/shoe1"]
  },
  {
    title: "Pointed Toe Ballet Flats",
    category: "footwear-women",
    storeId: "demo-store-5", // Apex
    brand: "Apex",
    gender: "women",
    price: 1850,
    comparePrice: 2450,
    fabric: "Faux Suede",
    occasion: ["Casual", "Office"],
    publicIds: ["aorgo/demo/shoe2"]
  },

  // --- TRENDING FOOTWEAR (footwear-trending) ---
  {
    title: "White Sports Runner Shoes",
    category: "footwear-trending",
    storeId: "demo-store-5", // Apex
    brand: "Apex",
    gender: "unisex",
    price: 3500,
    comparePrice: 4800,
    fabric: "Mesh & Rubber",
    occasion: ["Casual", "Sports"],
    publicIds: ["aorgo/demo/shoe1"]
  },
  {
    title: "Platform Leather Slides",
    category: "footwear-trending",
    storeId: "demo-store-5", // Apex
    brand: "Apex",
    gender: "women",
    price: 2100,
    comparePrice: 2900,
    fabric: "Leather",
    occasion: ["Casual", "Vacation"],
    publicIds: ["aorgo/demo/shoe2"]
  },
  {
    title: "Waterproof Leather Ankle Boots",
    category: "footwear-trending",
    storeId: "demo-store-5", // Apex
    brand: "Apex",
    gender: "men",
    price: 4800,
    comparePrice: 6500,
    fabric: "Waterproof Leather",
    occasion: ["Casual", "Hangout"],
    publicIds: ["aorgo/demo/shoe1"]
  }
];

async function seed() {
  console.log("🌱 Starting Day 10 Demo Seeding...");

  // A. Seed Stores
  console.log("🏪 Seeding 5 demo stores...");
  for (const store of stores) {
    await db.collection("stores").doc(store.id).set(store, { merge: true });
    console.log(`   ✅ Seeded store: ${store.name}`);
  }

  // B. Seed Users & Admin
  console.log("👥 Seeding demo users...");
  for (const user of users) {
    await db.collection("users").doc(user.uid).set(user, { merge: true });
    console.log(`   ✅ Seeded user: ${user.email} (${user.role})`);
  }

  // C. Seed Products
  console.log("🛍️ Seeding 36 demo products...");
  let count = 0;
  for (const p of products) {
    const id = db.collection("products").doc().id;
    const slug = p.title.toLowerCase().replace(/\s+/g, "-") + `-${id.slice(-4)}`;
    
    const productDoc = {
      id,
      storeId: p.storeId,
      sellerUid: stores.find((s) => s.id === p.storeId)?.ownerUid || "demo-seller-1",
      title: p.title,
      slug,
      description: `${p.title} — premium quality fashion wear from a trusted brand. Built with local materials and tailored for premium comfort.`,
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
        stock: 25
      })),
      images: p.publicIds,
      attributes: {
        fabric: p.fabric,
        occasion: p.occasion,
        fit: "regular"
      },
      status: "approved" as const,
      featured: count % 3 === 0,
      rating: 4.2,
      reviewCount: 0,
      totalSold: 0,
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
    count++;
  }
  
  console.log(`✅ Seeded ${count} demo products successfully!`);
  console.log("🎉 Seeding complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  });

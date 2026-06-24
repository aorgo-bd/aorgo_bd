import { config } from "dotenv";
config({ path: ".env.local" });

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  const decoded = Buffer.from(
    process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64!,
    "base64"
  ).toString("utf-8");
  initializeApp({ credential: cert(JSON.parse(decoded)) });
}
const db = getFirestore();

const banners = [
  {
    title: "NEW SEASON STYLES",
    subtitle: "Get up to 50% off on all new clothing arrivals. High quality and vibrant edits.",
    imagePublicId: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
    ctaUrl: "/category/women",
    position: "hero",
    active: true,
    order: 1,
  },
  {
    title: "MEN'S ESSENTIALS",
    subtitle: "Upgrade your wardrobe with our classic and sleek new designs. Crafted with premium local fabrics.",
    imagePublicId: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80",
    ctaUrl: "/category/men",
    position: "hero",
    active: true,
    order: 2,
  },
  {
    title: "TRENDING FOOTWEAR",
    subtitle: "Step out in confidence with our premium and handcrafted local footwear edits.",
    imagePublicId: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80",
    ctaUrl: "/category/footwear",
    position: "hero",
    active: true,
    order: 3,
  },
];

async function seed() {
  const batch = db.batch();
  for (let i = 0; i < banners.length; i++) {
    const banner = banners[i];
    const docId = `banner-${i + 1}`;
    batch.set(db.collection("banners").doc(docId), {
      ...banner,
      createdAt: Date.now(),
    });
  }
  await batch.commit();
  console.log(`✅ Seeded ${banners.length} hero banners successfully!`);
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const decoded = Buffer.from(process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64!, 'base64').toString('utf-8');
initializeApp({ credential: cert(JSON.parse(decoded)) });
const db = getFirestore();

const categories = [
  // ===== WOMEN =====
  { slug: 'women', name: "Women's Fashion", parent: null, order: 1 },
  { slug: 'women-tops', name: "Women's Tops", parent: 'women', order: 1 },
  { slug: 'women-ethnic', name: "Women's Ethnic Wear", parent: 'women', order: 2 },
  { slug: 'women-dresses', name: "Women's Dresses", parent: 'women', order: 3 },
  { slug: 'women-bottoms', name: "Women's Bottoms", parent: 'women', order: 4 },
  { slug: 'women-winter', name: "Women's Winter Wear", parent: 'women', order: 5 },

  // ===== MEN =====
  { slug: 'men', name: "Men's Fashion", parent: null, order: 2 },
  { slug: 'men-tops', name: "Men's Tops", parent: 'men', order: 1 },
  { slug: 'men-bottoms', name: "Men's Bottoms", parent: 'men', order: 2 },
  { slug: 'men-ethnic', name: "Men's Ethnic Wear", parent: 'men', order: 3 },
  { slug: 'men-winter', name: "Men's Winter Wear", parent: 'men', order: 4 },

  // ===== FOOTWEAR =====
  { slug: 'footwear', name: 'Footwear', parent: null, order: 3 },
  { slug: 'footwear-men', name: "Men's Footwear", parent: 'footwear', order: 1 },
  { slug: 'footwear-women', name: "Women's Footwear", parent: 'footwear', order: 2 },
  { slug: 'footwear-trending', name: 'Trending Footwear Collections', parent: 'footwear', order: 3 },
];

async function seed() {
  const batch = db.batch();
  for (const cat of categories) {
    batch.set(db.collection('categories').doc(cat.slug), {
      ...cat,
      productCount: 0,
      createdAt: Date.now(),
    });
  }
  await batch.commit();
  console.log(`✅ Seeded ${categories.length} categories`);
}

seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

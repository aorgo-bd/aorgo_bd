import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase/admin';
import { Product, Category } from '@/lib/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aorgo-bd.vercel.app';

  // Static routes
  const routes = [
    '',
    '/products',
    '/cart',
    '/wishlist',
    '/login',
    '/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    if (!adminDb) {
      throw new Error("adminDb is not initialized");
    }
    // 1. Fetch categories
    const categoriesSnap = await adminDb.collection('categories').get();
    const categoryRoutes = categoriesSnap.docs.map((doc) => {
      const cat = doc.data() as Category;
      const slug = cat.slug || doc.id;
      return {
        url: `${baseUrl}/category/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

    // 2. Fetch approved products
    const productsSnap = await adminDb.collection('products')
      .where('status', '==', 'approved')
      .get();
    const productRoutes = productsSnap.docs.map((doc) => {
      const prod = doc.data() as Product;
      const slug = prod.slug || doc.id;
      return {
        url: `${baseUrl}/product/${slug}`,
        lastModified: new Date(prod.updatedAt || Date.now()),
        changeFrequency: 'daily' as const,
        priority: 0.6,
      };
    });

    return [...routes, ...categoryRoutes, ...productRoutes];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return routes;
  }
}

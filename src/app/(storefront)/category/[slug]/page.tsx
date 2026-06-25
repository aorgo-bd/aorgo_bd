import { Metadata } from 'next';
import { adminDb } from '@/lib/firebase/admin';
import { Category } from '@/lib/types';
import CategoryClient from './CategoryClient';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;

  try {
    if (!adminDb) {
      throw new Error("adminDb is not initialized");
    }
    const categoryDoc = await adminDb.collection('categories').doc(slug).get();

    if (!categoryDoc.exists) {
      // Fallback if not matched exactly (e.g. nested subcategory slug)
      const formattedSlug = slug.replace(/-/g, ' ');
      const title = formattedSlug.charAt(0).toUpperCase() + formattedSlug.slice(1);
      return {
        title: `${title} | AORGO`,
        description: `Browse the best collection of ${title} on AORGO.`,
      };
    }

    const category = categoryDoc.data() as Category;

    return {
      title: `${category.name} Collection | AORGO`,
      description: `Shop the latest ${category.name} collections, fashion essentials, footwear, and apparel at AORGO Bangladesh.`,
      openGraph: {
        title: `${category.name} Collection | AORGO`,
        description: `Shop the latest ${category.name} collections, fashion essentials, footwear, and apparel at AORGO Bangladesh.`,
        type: 'website',
      },
    };
  } catch (error) {
    console.error('Error generating category metadata:', error);
    return {
      title: 'AORGO Fashion & Lifestyle',
      description: 'Multi-vendor fashion & lifestyle marketplace for Bangladesh',
    };
  }
}

export default function CategoryPage() {
  return <CategoryClient />;
}

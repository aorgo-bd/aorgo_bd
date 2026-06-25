import { Metadata } from 'next';
import { adminDb } from '@/lib/firebase/admin';
import { Product } from '@/lib/types';
import { cloudinaryUrl } from '@/lib/cloudinary';
import ProductDetailClient from './ProductDetailClient';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;

  try {
    const productsSnap = await adminDb.collection('products')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (productsSnap.empty) {
      return {
        title: 'Product Not Found | AORGO',
        description: 'The requested product could not be found.',
      };
    }

    const product = productsSnap.docs[0].data() as Product;
    const ogImage = product.images?.[0]
      ? cloudinaryUrl(product.images[0], { w: 1200, h: 630 })
      : 'https://aorgo-bd.vercel.app/default-og-image.jpg';

    return {
      title: `${product.title} | ${product.brand} | AORGO`,
      description: product.description?.substring(0, 160) || `Buy ${product.title} on AORGO.`,
      openGraph: {
        title: `${product.title} | ${product.brand} | AORGO`,
        description: product.description?.substring(0, 160) || `Buy ${product.title} on AORGO.`,
        images: [{ url: ogImage, width: 1200, height: 630, alt: product.title }],
        type: 'website',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'AORGO Fashion & Lifestyle',
      description: 'Multi-vendor fashion & lifestyle marketplace for Bangladesh',
    };
  }
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}

import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import type { Product } from "@/lib/types";
import ProductDetailClient from "./ProductDetailClient";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { MOCK_PRODUCTS } from "@/lib/data/mock-db";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

interface Props {
  params: { slug: string };
}

async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!adminDb) return USE_MOCKS ? MOCK_PRODUCTS.find((p) => p.slug === slug) || null : null;
  try {
    const snap = await adminDb
      .collection("products")
      .where("slug", "==", slug)
      .where("status", "==", "approved")
      .limit(1)
      .get();
    if (snap.empty) {
      return USE_MOCKS ? MOCK_PRODUCTS.find((p) => p.slug === slug) || null : null;
    }
    const doc = snap.docs[0];
    return JSON.parse(JSON.stringify({ id: doc.id, ...doc.data() })); // serialize timestamps
  } catch (err) {
    console.warn("Error fetching product by slug on server, falling back to mock:", err);
    return USE_MOCKS ? MOCK_PRODUCTS.find((p) => p.slug === slug) || null : null;
  }
}

export async function generateMetadata({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Product not found | AORGO" };
  return {
    title: `${product.title} | ${product.brand} | AORGO`,
    description: (product.description || "").substring(0, 160),
    openGraph: {
      images: product.images?.length ? [cloudinaryUrl(product.images[0], { w: 1200, h: 630 })] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aorgo-bd.vercel.app";
  const inStock = (product.variants ?? []).some((v) => (v.stock ?? 0) > 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: (product.description || "").substring(0, 500),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    image: product.images?.length ? [cloudinaryUrl(product.images[0], { w: 1200, h: 1500 })] : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: product.price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${baseUrl}/product/${product.slug}`,
    },
    aggregateRating:
      product.reviewCount && product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient initialProduct={product} />
    </>
  );
}

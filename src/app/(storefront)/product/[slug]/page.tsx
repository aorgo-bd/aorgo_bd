import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import type { Product } from "@/lib/types";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: { slug: string };
}

async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!adminDb) return null;
  try {
    const snap = await adminDb
      .collection("products")
      .where("slug", "==", slug)
      .where("status", "==", "approved")
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return JSON.parse(JSON.stringify({ id: doc.id, ...doc.data() })); // serialize timestamps
  } catch (err) {
    console.error("Error fetching product by slug on server:", err);
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Product not found | AORGO" };
  return {
    title: `${product.title} | ${product.brand} | AORGO`,
    description: (product.description || "").substring(0, 160),
    openGraph: {
      images: product.images?.length ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();
  return <ProductDetailClient initialProduct={product} />;
}

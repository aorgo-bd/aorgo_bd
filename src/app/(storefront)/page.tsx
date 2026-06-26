import type { Query } from "firebase-admin/firestore";
import HeroCarousel from "@/components/storefront/HeroCarousel";
import ProductRail from "@/components/storefront/ProductRail";
import { adminDb } from "@/lib/firebase/admin";
import type { Banner, Product } from "@/lib/types";
import type { ProductFilter } from "@/lib/hooks/useProducts";

export const revalidate = 300;

function toPlainValue(value: any): any {
  if (value == null) return value;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (Array.isArray(value)) return value.map(toPlainValue);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, toPlainValue(entryValue)])
    );
  }
  return value;
}

function applyProductFilter(products: Product[], filter: ProductFilter) {
  let filtered = products;

  if (filter.featured !== undefined) {
    filtered = filtered.filter((product) => product.featured === filter.featured);
  }

  if (filter.category) {
    filtered = filtered.filter((product) => product.category === filter.category);
  } else if (filter.subcategories?.length) {
    filtered = filtered.filter((product) => filter.subcategories!.includes(product.category));
  }

  if (filter.search) {
    const tokens = filter.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    filtered = filtered.filter((product) => {
      const haystack = [product.title, product.brand, product.description, ...(product.keywords ?? [])]
        .join(" ")
        .toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }

  if (filter.minPrice !== undefined) {
    filtered = filtered.filter((product) => product.price >= filter.minPrice!);
  }

  if (filter.maxPrice !== undefined) {
    filtered = filtered.filter((product) => product.price <= filter.maxPrice!);
  }

  const sortBy = filter.sortBy ?? "createdAt";
  const sortOrder = filter.sortOrder ?? "desc";
  filtered = [...filtered].sort((a, b) => {
    const valueA = a[sortBy] ?? 0;
    const valueB = b[sortBy] ?? 0;
    if (valueA === valueB) return 0;
    return sortOrder === "asc" ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
  });

  return filtered.slice(0, filter.limit ?? 8);
}

async function getFallbackHeroBanners(): Promise<Banner[]> {
  if (!adminDb) return [];

  const snap = await adminDb.collection("banners").where("active", "==", true).limit(20).get();
  return snap.docs
    .map((doc) => ({ id: doc.id, ...toPlainValue(doc.data()) }) as Banner)
    .filter((banner) => banner.position === "hero")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

async function getFallbackApprovedProducts(filter: ProductFilter): Promise<Product[]> {
  if (!adminDb) return [];

  const snap = await adminDb
    .collection("products")
    .where("status", "==", "approved")
    .limit(100)
    .get();
  const products = snap.docs.map((doc) => ({
    id: doc.id,
    ...toPlainValue(doc.data()),
  })) as Product[];

  return applyProductFilter(products, filter);
}
async function getHeroBanners(): Promise<Banner[]> {
  if (!adminDb) return [];

  try {
    const snap = await adminDb
      .collection("banners")
      .where("active", "==", true)
      .where("position", "==", "hero")
      .orderBy("order", "asc")
      .get();

    return snap.docs.map((doc) => ({
      id: doc.id,
      ...toPlainValue(doc.data()),
    })) as Banner[];
  } catch {
    return getFallbackHeroBanners();
  }
}

async function getApprovedProducts(filter: ProductFilter): Promise<Product[]> {
  if (!adminDb) return [];

  try {
    let productQuery: Query = adminDb
      .collection("products")
      .where("status", "==", "approved");

    if (filter.featured !== undefined) {
      productQuery = productQuery.where("featured", "==", filter.featured);
    }

    if (filter.category) {
      productQuery = productQuery.where("category", "==", filter.category);
    } else if (filter.subcategories?.length) {
      productQuery = productQuery.where("category", "in", filter.subcategories.slice(0, 10));
    }

    if (filter.search) {
      const primaryToken = filter.search.trim().toLowerCase().split(/\s+/).filter(Boolean)[0];
      if (primaryToken) {
        productQuery = productQuery.where("keywords", "array-contains", primaryToken);
      }
    }

    const sortBy = filter.sortBy ?? "createdAt";
    const sortOrder = filter.sortOrder ?? "desc";
    productQuery = productQuery.orderBy(sortBy, sortOrder).limit(filter.limit ?? 8);

    const snap = await productQuery.get();
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...toPlainValue(doc.data()),
    })) as Product[];
  } catch {
    return getFallbackApprovedProducts(filter);
  }
}

function Separator() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <hr className="border-t border-gray-100" />
    </div>
  );
}

export default async function StorefrontHomePage() {
  const newArrivalsFilter: ProductFilter = {
    limit: 8,
    sortBy: "createdAt",
    sortOrder: "desc",
  };
  const topSellingFilter: ProductFilter = {
    limit: 8,
    sortBy: "totalSold",
    sortOrder: "desc",
  };
  const featuredFilter: ProductFilter = {
    limit: 8,
    featured: true,
    sortBy: "createdAt",
    sortOrder: "desc",
  };
  const trendingFilter: ProductFilter = {
    limit: 8,
    sortBy: "rating",
    sortOrder: "desc",
  };

  const [banners, newArrivals, topSelling, featured, trending] = await Promise.all([
    getHeroBanners(),
    getApprovedProducts(newArrivalsFilter),
    getApprovedProducts(topSellingFilter),
    getApprovedProducts(featuredFilter),
    getApprovedProducts(trendingFilter),
  ]);

  return (
    <div className="bg-white min-h-screen pb-12 flex flex-col">
      <HeroCarousel initialBanners={banners} />

      <div className="space-y-6 sm:space-y-12 py-8 sm:py-16">
        <ProductRail title="New Arrivals" filter={newArrivalsFilter} initialProducts={newArrivals} />
        <Separator />
        <ProductRail title="Top Selling" filter={topSellingFilter} initialProducts={topSelling} />
        <Separator />
        <ProductRail title="Featured Collection" filter={featuredFilter} initialProducts={featured} />
        <Separator />
        <ProductRail title="Trending Deals" filter={trendingFilter} initialProducts={trending} />
      </div>
    </div>
  );
}
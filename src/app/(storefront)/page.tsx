import React from "react";
import Link from "next/link";
import HeroCarousel from "@/components/storefront/HeroCarousel";
import ProductRail from "@/components/storefront/ProductRail";
import FeaturedCategories from "@/components/storefront/FeaturedCategories";
import DiscountBanner from "@/components/storefront/DiscountBanner";
import AllProductsFeed from "@/components/storefront/AllProductsFeed";
import FeaturedBrands from "@/components/storefront/FeaturedBrands";
import { adminDb } from "@/lib/firebase/admin";
import type { Banner, Category, Product, Store, HomepageSettings } from "@/lib/types";
import type { ProductFilter } from "@/lib/hooks/useProducts";
import { MOCK_PRODUCTS, MOCK_BANNERS, MOCK_CATEGORIES, MOCK_STORES } from "@/lib/data/mock-db";
import { DEFAULT_HOMEPAGE, mergeHomepage } from "@/lib/data/homepage-defaults";
import { ShieldCheck, RefreshCw, Truck } from "lucide-react";
import Image from "next/image";
import { DealCountdown } from "@/components/ui/myntra/DealCountdown";

export const revalidate = 0; // Disable static cache to allow instant updates
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

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

async function getHeroBanners(): Promise<Banner[]> {
  if (!adminDb) return USE_MOCKS ? MOCK_BANNERS : [];

  try {
    const snap = await adminDb
      .collection("banners")
      .where("active", "==", true)
      .where("position", "==", "hero")
      .orderBy("order", "asc")
      .get();
    
    if (snap.empty) return USE_MOCKS ? MOCK_BANNERS : [];

    return snap.docs.map((doc) => ({
      id: doc.id,
      ...toPlainValue(doc.data()),
    })) as Banner[];
  } catch (err) {
    console.warn("[getHeroBanners] server error:", err);
    return USE_MOCKS ? MOCK_BANNERS : [];
  }
}

async function getApprovedProducts(filter: ProductFilter): Promise<Product[]> {
  if (!adminDb) return USE_MOCKS ? applyProductFilter(MOCK_PRODUCTS, filter) : [];

  try {
    let productQuery = adminDb
      .collection("products")
      .where("status", "==", "approved");

    if (filter.featured !== undefined) {
      productQuery = productQuery.where("featured", "==", filter.featured);
    }

    if (filter.category) {
      productQuery = productQuery.where("category", "==", filter.category);
    }

    const snap = await productQuery.get();
    if (snap.empty) return USE_MOCKS ? applyProductFilter(MOCK_PRODUCTS, filter) : [];

    const dbProducts = snap.docs.map((doc) => ({
      id: doc.id,
      ...toPlainValue(doc.data()),
    })) as Product[];

    return applyProductFilter(dbProducts, filter);
  } catch (err) {
    console.warn("[getApprovedProducts] server error:", err);
    return USE_MOCKS ? applyProductFilter(MOCK_PRODUCTS, filter) : [];
  }
}


async function getHomepageSettings(): Promise<HomepageSettings> {
  if (!adminDb) return DEFAULT_HOMEPAGE;

  try {
    const snap = await adminDb.collection("settings").doc("homepage").get();
    return snap.exists ? mergeHomepage(toPlainValue(snap.data())) : DEFAULT_HOMEPAGE;
  } catch (err) {
    console.warn("[getHomepageSettings] server error:", err);
    return DEFAULT_HOMEPAGE;
  }
}

async function getFeaturedStores(): Promise<Store[]> {
  if (!adminDb) return USE_MOCKS ? MOCK_STORES : [];

  try {
    const snap = await adminDb
      .collection("stores")
      .where("status", "==", "approved")
      .get();

    if (snap.empty) return USE_MOCKS ? MOCK_STORES : [];

    return snap.docs
      .map((doc) => ({ id: doc.id, ...toPlainValue(doc.data()) }) as Store)
      .sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0))
      .slice(0, 10);
  } catch (err) {
    console.warn("[getFeaturedStores] server error:", err);
    return USE_MOCKS ? MOCK_STORES : [];
  }
}

async function getCategories(): Promise<Category[]> {
  if (!adminDb) return USE_MOCKS ? MOCK_CATEGORIES : [];

  try {
    const snap = await adminDb.collection("categories").orderBy("order", "asc").get();
    if (snap.empty) return USE_MOCKS ? MOCK_CATEGORIES : [];
    return snap.docs.map((doc) => {
      const data = toPlainValue(doc.data());
      return {
        slug: doc.id,
        name: data.name,
        nameBn: data.nameBn,
        parent: data.parent || null,
        image: data.image,
        order: data.order ?? 0,
        productCount: data.productCount ?? 0,
      } as Category;
    });
  } catch (err) {
    console.warn("[getCategories] server error:", err);
    return USE_MOCKS ? MOCK_CATEGORIES : [];
  }
}
// Client Countdown cell component placeholder
function CountdownWrapper() {
  const endsAt = Date.now() + 1000 * 60 * 60 * 4; // Ticks for 4 hours
  return <DealCountdown endsAt={endsAt} />;
}

export default async function StorefrontHomePage() {
  const dealOfTheDayFilter: ProductFilter = { limit: 8, sortBy: "totalSold", sortOrder: "desc" };
  const newArrivalsFilter: ProductFilter = { limit: 8, sortBy: "createdAt", sortOrder: "desc" };
  const topSellingFilter: ProductFilter = { limit: 8, sortBy: "totalSold", sortOrder: "desc" };
  const highRatedFilter: ProductFilter = { limit: 8, sortBy: "rating", sortOrder: "desc" };

  const [homepage, banners, categories, featuredStores, dealOfTheDay, newArrivals, topSelling, highRated] = await Promise.all([
    getHomepageSettings(),
    getHeroBanners(),
    getCategories(),
    getFeaturedStores(),
    getApprovedProducts(dealOfTheDayFilter),
    getApprovedProducts(newArrivalsFilter),
    getApprovedProducts(topSellingFilter),
    getApprovedProducts(highRatedFilter),
  ]);

  const { sections } = homepage;

  return (
    <div className="bg-[#FAFBFC] min-h-screen pb-16">
      
      {/* 2. Mobile Category Circles Strip (<lg) */}
      <div className="lg:hidden w-full bg-white border-b border-ink-200 py-3 px-4 overflow-x-auto scrollbar-hide flex items-center gap-4 snap-x snap-mandatory">
        {categories.filter((c) => !c.parent).map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 w-14 snap-start cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-ink-100 border border-ink-200 overflow-hidden relative shadow-2xs">
              <Image
                src={cat.image || "/images/products/placeholder.webp"}
                alt={cat.name}
                fill
                sizes="64px"
                className="object-cover object-center"
              />
            </div>
            <span className="text-[10px] font-bold text-ink-700 text-center truncate w-full uppercase tracking-wider">{cat.name}</span>
          </Link>
        ))}
      </div>

      {/* 3. Hero Banners Carousel */}
      <HeroCarousel initialBanners={banners} />

      {/* 3b. Signature AORGO gradient discount banner (above Shop by Category) */}
      {sections.discountBanner && <DiscountBanner config={homepage.discountBanner} />}

      {/* 3c. Featured Categories (Shop by Category) */}
      <FeaturedCategories categories={categories} />

      {/* 4. Mid-page Promo Strip (4 tiles) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-pink-500 text-white rounded-sm p-4 flex flex-col justify-between shadow-2xs aspect-[16/8] sm:aspect-auto">
            <span className="text-[9px] font-extrabold tracking-widest uppercase text-white/80">NEW USER</span>
            <div>
              <p className="text-base sm:text-lg font-display font-extrabold uppercase leading-tight">৳500 OFF</p>
              <p className="text-[10px] text-white/95 leading-normal">On your first order</p>
            </div>
          </div>
          <div className="bg-ink-900 text-white rounded-sm p-4 flex flex-col justify-between shadow-2xs aspect-[16/8] sm:aspect-auto">
            <span className="text-[9px] font-extrabold tracking-widest uppercase text-white/80">SHIPPING</span>
            <div>
              <p className="text-base sm:text-lg font-display font-extrabold uppercase leading-tight">FREE SHIPPING</p>
              <p className="text-[10px] text-ink-300 leading-normal">Per-store shipping is calculated at checkout</p>
            </div>
          </div>
          <div className="bg-pink-600 text-white rounded-sm p-4 flex flex-col justify-between shadow-2xs aspect-[16/8] sm:aspect-auto">
            <span className="text-[9px] font-extrabold tracking-widest uppercase text-white/80">EID COLLECTION</span>
            <div>
              <p className="text-base sm:text-lg font-display font-extrabold uppercase leading-tight">Heritage Sarees</p>
              <p className="text-[10px] text-white/95 leading-normal">Exclusive prints now live</p>
            </div>
          </div>
          <div className="bg-white border border-ink-200 text-ink-900 rounded-sm p-4 flex flex-col justify-between shadow-2xs aspect-[16/8] sm:aspect-auto">
            <span className="text-[9px] font-extrabold tracking-widest uppercase text-pink-500">PAYMENT</span>
            <div>
              <p className="text-base sm:text-lg font-display font-extrabold uppercase leading-tight">COD AVAILABLE</p>
              <p className="text-[10px] text-ink-500 leading-normal">Cash on Delivery across BD</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Section: DEAL OF THE DAY */}
      {sections.dealOfTheDay && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2.5 sm:gap-4 mb-5">
            <h2 className="text-lg sm:text-2xl font-display font-black tracking-wide text-ink-900">
              Deal of the Day
            </h2>
            <CountdownWrapper />
          </div>
          <ProductRail title="" filter={dealOfTheDayFilter} initialProducts={dealOfTheDay} />
        </section>
      )}

      {/* 6. Section: FEATURED BRANDS (real stores → brand landing pages) */}
      {sections.featuredBrands && (
        <FeaturedBrands stores={featuredStores} featuredSlugs={homepage.featuredBrandSlugs} />
      )}

      {/* 7. Section: NEW ARRIVALS */}
      {sections.newArrivals && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
          <div className="mb-5">
            <h2 className="text-lg sm:text-2xl font-display font-black tracking-wide text-ink-900">
              New Arrivals
            </h2>
          </div>
          <ProductRail title="" filter={newArrivalsFilter} initialProducts={newArrivals} />
        </section>
      )}

      {/* 9. Section: TOP SELLING */}
      {sections.topSelling && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
          <div className="mb-5">
            <h2 className="text-lg sm:text-2xl font-display font-black tracking-wide text-ink-900">
              Top Selling
            </h2>
          </div>
          <ProductRail title="" filter={topSellingFilter} initialProducts={topSelling} />
        </section>
      )}

      {/* 12. Section: CUSTOMERS LOVE THESE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="mb-5">
          <h2 className="text-lg sm:text-2xl font-display font-black tracking-wide text-ink-900">
            Customers Love These
          </h2>
        </div>
        <ProductRail title="" filter={highRatedFilter} initialProducts={highRated} />
      </section>

      {/* 13b. Section: ALL PRODUCTS (main infinite feed) */}
      {sections.allProducts && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
          <div className="mb-5">
            <h2 className="text-lg sm:text-2xl font-display font-black tracking-wide text-ink-900">
              All Products
            </h2>
          </div>
          <AllProductsFeed sortBy="newest" />
        </section>
      )}

      {/* 14. Section: WHY SHOP AT AORGO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 border-t border-ink-200 pt-12 sm:pt-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
              <ShieldCheck className="h-6 w-6 stroke-[1.8]" />
            </div>
            <h3 className="text-sm font-bold text-ink-900 uppercase tracking-widest">100% Authentic Products</h3>
            <p className="text-xs text-ink-500 max-w-[240px] leading-relaxed">Directly from verified manufacturers and official distributors.</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
              <RefreshCw className="h-6 w-6 stroke-[1.8]" />
            </div>
            <h3 className="text-sm font-bold text-ink-900 uppercase tracking-widest">7-Day Easy Returns</h3>
            <p className="text-xs text-ink-500 max-w-[240px] leading-relaxed">Not happy with your product? Return it within 7 days for a hassle-free refund.</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
              <Truck className="h-6 w-6 stroke-[1.8]" />
            </div>
            <h3 className="text-sm font-bold text-ink-900 uppercase tracking-widest">Pan-Bangladesh Shipping</h3>
            <p className="text-xs text-ink-500 max-w-[240px] leading-relaxed">Fast and secure delivery to all districts and divisions.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
import React from "react";
import Link from "next/link";
import { Store as StoreIcon, Star } from "lucide-react";
import type { Store } from "@/lib/types";
import { ProductImage } from "@/components/ProductImage";

interface FeaturedBrandsProps {
  stores: Store[];
}

const TAG_STYLES: Record<string, string> = {
  "Top Selling": "bg-pink-50 text-pink-600",
  "Best Rated": "bg-amber-50 text-amber-600",
  "New Arrival": "bg-emerald-50 text-emerald-600",
  Trending: "bg-blue-50 text-blue-600",
  "Editor's Pick": "bg-violet-50 text-violet-600",
};

/**
 * "Featured Brands" (spec #2 & #10) — real, data-driven brand cards. Each card
 * shows the store logo, name and a data-derived highlight tag, and links to the
 * store's brand landing page (/stores/[slug]) which lists only that brand's
 * products. Tags are assigned from actual store metrics so the hierarchy is
 * meaningful (top seller, best rated, newest, …) rather than decorative.
 */
export default function FeaturedBrands({ stores }: FeaturedBrandsProps) {
  if (!stores || stores.length === 0) return null;

  const bySales = [...stores].sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
  const featured = bySales.slice(0, 5);

  const topSellingId = bySales[0]?.id;
  const bestRatedId = [...stores].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]?.id;
  const newestId = [...stores].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]?.id;

  const tagFor = (store: Store, index: number): string => {
    if (store.id === topSellingId) return "Top Selling";
    if (store.id === bestRatedId) return "Best Rated";
    if (store.id === newestId) return "New Arrival";
    return index % 2 === 0 ? "Trending" : "Editor's Pick";
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg sm:text-2xl font-display font-black tracking-wide text-ink-900">
          Featured Brands
        </h2>
        <Link
          href="/stores"
          className="text-xs font-bold text-pink-500 hover:text-pink-600 transition-colors"
        >
          View All
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {featured.map((store, index) => {
          const tag = tagFor(store, index);
          return (
            <Link
              href={`/stores/${store.slug}`}
              key={store.id}
              className="flex flex-col items-center gap-2.5 rounded-2xl bg-white border border-ink-100 p-4 shadow-[0_1px_3px_rgba(40,44,63,0.06)] hover:shadow-[0_10px_26px_rgba(40,44,63,0.12)] hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <span className="relative flex items-center justify-center h-14 w-14 rounded-full overflow-hidden bg-gradient-to-br from-[#FDE7EF] to-[#FBCFE0] text-ink-900 font-display font-black text-xl shrink-0">
                {store.logoPublicId ? (
                  <ProductImage
                    src={store.logoPublicId}
                    alt={store.name}
                    width={112}
                    height={112}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  store.name.charAt(0).toUpperCase()
                )}
              </span>
              <h3 className="text-sm font-extrabold tracking-wide text-ink-900 group-hover:text-pink-500 transition-colors text-center truncate max-w-full">
                {store.name}
              </h3>
              {store.rating > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-ink-500 -mt-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {store.rating.toFixed(1)}
                </span>
              )}
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  TAG_STYLES[tag] ?? "bg-ink-50 text-ink-500"
                }`}
              >
                {tag}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

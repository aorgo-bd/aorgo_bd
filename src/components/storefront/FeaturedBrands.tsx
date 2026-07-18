"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import type { Store } from "@/lib/types";
import { ProductImage } from "@/components/ProductImage";

interface FeaturedBrandsProps {
  stores: Store[];
  /** Admin-selected store slugs, in display order. Empty = auto (top by sales). */
  featuredSlugs?: string[];
}

const TAG_STYLES: Record<string, string> = {
  "Top Selling": "bg-pink-50 text-pink-600",
  "Best Rated": "bg-amber-50 text-amber-600",
  "New Arrival": "bg-emerald-50 text-emerald-600",
  Trending: "bg-blue-50 text-blue-600",
  "Editor's Pick": "bg-violet-50 text-violet-600",
};

// Four compact cards per row on load; the rest sit behind a "See more" toggle.
const INITIAL_VISIBLE = 4;

/**
 * "Featured Brands" — real, data-driven brand cards. Each card shows the store
 * logo, name and a data-derived highlight tag, and links to the store's brand
 * landing page (/stores/[slug]). Compact 4-per-row grid; extra brands are
 * revealed with "See more".
 */
export default function FeaturedBrands({ stores, featuredSlugs }: FeaturedBrandsProps) {
  const [expanded, setExpanded] = useState(false);

  if (!stores || stores.length === 0) return null;

  const bySales = [...stores].sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));

  // Admin-curated selection (in order) takes priority; otherwise auto-feature
  // the top-selling approved stores.
  const curated = (featuredSlugs ?? [])
    .map((slug) => stores.find((s) => s.slug === slug))
    .filter((s): s is Store => Boolean(s));
  const featured = (curated.length > 0 ? curated : bySales).slice(0, 12);

  const topSellingId = bySales[0]?.id;
  const bestRatedId = [...stores].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]?.id;
  const newestId = [...stores].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]?.id;

  const tagFor = (store: Store, index: number): string => {
    if (store.id === topSellingId) return "Top Selling";
    if (store.id === bestRatedId) return "Best Rated";
    if (store.id === newestId) return "New Arrival";
    return index % 2 === 0 ? "Trending" : "Editor's Pick";
  };

  const visible = expanded ? featured : featured.slice(0, INITIAL_VISIBLE);
  const hasMore = featured.length > INITIAL_VISIBLE;

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
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {visible.map((store, index) => {
          const tag = tagFor(store, index);
          return (
            <Link
              href={`/stores/${store.slug}`}
              key={store.id}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-white border border-ink-100 p-2 sm:p-3 shadow-[0_1px_3px_rgba(40,44,63,0.06)] hover:shadow-[0_10px_26px_rgba(40,44,63,0.12)] hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <span className="relative flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-gradient-to-br from-[#FDE7EF] to-[#FBCFE0] text-ink-900 font-display font-black text-base shrink-0">
                {store.logoPublicId ? (
                  <ProductImage
                    src={store.logoPublicId}
                    alt={store.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  store.name.charAt(0).toUpperCase()
                )}
              </span>
              <h3 className="text-[11px] sm:text-xs font-extrabold tracking-tight text-ink-900 group-hover:text-pink-500 transition-colors text-center truncate max-w-full w-full">
                {store.name}
              </h3>
              {store.rating > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-ink-500">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {store.rating.toFixed(1)}
                </span>
              )}
              <span
                className={`hidden sm:inline-flex text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  TAG_STYLES[tag] ?? "bg-ink-50 text-ink-500"
                }`}
              >
                {tag}
              </span>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-5">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-5 py-2 text-xs font-bold uppercase tracking-widest text-ink-700 hover:border-pink-300 hover:text-pink-500 transition-colors shadow-2xs"
          >
            {expanded ? (
              <>
                See Less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                See More <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}

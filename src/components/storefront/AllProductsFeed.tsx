"use client";

import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useProductSearch, SearchFilters } from "@/lib/hooks/useProductSearch";
import ProductCard from "@/components/storefront/ProductCard";
import { Product } from "@/lib/types";

interface AllProductsFeedProps {
  filters?: SearchFilters;
  sortBy?: "newest" | "price-asc" | "price-desc" | "rating-desc" | "popular";
  /** grid classes for the product grid wrapper */
  gridClassName?: string;
}

/**
 * Infinite, lazy-loading product grid. Auto-fetches the next page when the
 * sentinel scrolls into view (no "Load More" button, no pagination) and keeps
 * pulling until the inventory is exhausted. Shared by the homepage "All
 * Products" section and the /products page.
 */
export default function AllProductsFeed({
  filters = {},
  sortBy = "newest",
  gridClassName = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4",
}: AllProductsFeedProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useProductSearch({ filters, sortBy, limitCount: 24 });

  const sentinelRef = useRef<HTMLDivElement>(null);

  const products: Product[] = data?.pages.flatMap((page) => page.products) || [];

  // Auto-load the next page when the sentinel enters the viewport.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className={gridClassName}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-ink-100 rounded-sm animate-pulse" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-20 text-center bg-white border border-ink-200 rounded-sm">
        <h3 className="text-base font-bold text-ink-700 mb-1">No products found</h3>
        <p className="text-sm text-ink-500">Check back soon — new arrivals drop regularly.</p>
      </div>
    );
  }

  return (
    <>
      <div className={gridClassName}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Infinite-scroll sentinel + loading state */}
      <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-8">
        {isFetchingNextPage && (
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more
          </span>
        )}
        {!hasNextPage && (
          <span className="text-[11px] font-bold uppercase tracking-widest text-ink-300">
            You&apos;ve reached the end
          </span>
        )}
      </div>
    </>
  );
}

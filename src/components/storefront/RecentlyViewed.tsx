"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRecentlyViewedStore } from "@/lib/stores/recentlyViewed";
import ProductCard from "@/components/storefront/ProductCard";
import { Product } from "@/lib/types";

/**
 * "Recently Viewed" horizontal slider (spec #13). Reads the client-side view
 * history and excludes the product currently on screen. Renders nothing until
 * there is at least one other product to show, so it never leaves an empty gap.
 */
export default function RecentlyViewed({ currentProductId }: { currentProductId: string }) {
  const items = useRecentlyViewedStore((s) => s.items);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Avoid hydration mismatch: only render the persisted list after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const products = items.filter((p: Product) => p.id !== currentProductId);

  if (!mounted || products.length === 0) return null;

  const scrollBy = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section className="py-8 border-t border-gray-100">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-bold text-ink-700 uppercase tracking-widest">
          Recently Viewed
        </h2>
        <div className="hidden sm:flex items-center space-x-2">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="p-2 rounded-full border border-ink-200 bg-white text-ink-700 hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-colors"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="p-2 rounded-full border border-ink-200 bg-white text-ink-700 hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-colors"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex space-x-4 sm:space-x-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4 select-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((p: Product) => (
          <div
            key={p.id}
            className="min-w-[200px] sm:min-w-[240px] md:min-w-[260px] w-[200px] sm:w-[240px] md:w-[260px] snap-start shrink-0"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { useProducts, ProductFilter } from "@/lib/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductRailProps {
  title: string;
  filter: ProductFilter;
}

export default function ProductRail({ title, filter }: ProductRailProps) {
  const { data: products = [], isLoading, error } = useProducts(filter);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse" />
        </div>
        <div className="flex space-x-4 overflow-x-hidden">
          {[1, 2, 4, 5].map((i) => (
            <div key={i} className="min-w-[220px] sm:min-w-[280px] w-[280px] aspect-[4/5] bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative group">
      
      {/* Header with Navigation controls */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-black uppercase tracking-tight">
          {title}
        </h2>

        {/* Scroll Buttons - Desktop Only */}
        <div className="hidden sm:flex items-center space-x-2">
          <button
            onClick={scrollLeft}
            className="p-2 rounded-full border border-black/10 bg-white text-black hover:bg-black hover:text-white transition-all shadow-xs focus:outline-none"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={scrollRight}
            className="p-2 rounded-full border border-black/10 bg-white text-black hover:bg-black hover:text-white transition-all shadow-xs focus:outline-none"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Snap Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex space-x-4 sm:space-x-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4 select-none cursor-grab active:cursor-grabbing"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {products.map((product: any) => (
          <div
            key={product.id}
            className="min-w-[200px] sm:min-w-[260px] md:min-w-[280px] w-[200px] sm:w-[260px] md:w-[280px] snap-start shrink-0"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      
    </section>
  );
}

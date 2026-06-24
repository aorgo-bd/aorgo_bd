"use client";

import React from "react";
import HeroCarousel from "@/components/storefront/HeroCarousel";
import ProductRail from "@/components/storefront/ProductRail";

export default function StorefrontHomePage() {
  return (
    <div className="bg-white min-h-screen pb-12 flex flex-col">
      {/* Dynamic Hero banner Carousel */}
      <HeroCarousel />

      {/* Product Rails */}
      <div className="space-y-6 sm:space-y-12 py-8 sm:py-16">
        
        {/* 1. New Arrivals */}
        <ProductRail
          title="New Arrivals"
          filter={{
            limit: 8,
            sortBy: "createdAt",
            sortOrder: "desc",
          }}
        />

        {/* Separator line */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <hr className="border-t border-gray-100" />
        </div>

        {/* 2. Top Selling */}
        <ProductRail
          title="Top Selling"
          filter={{
            limit: 8,
            sortBy: "totalSold",
            sortOrder: "desc",
          }}
        />

        {/* Separator line */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <hr className="border-t border-gray-100" />
        </div>

        {/* 3. Featured Collection */}
        <ProductRail
          title="Featured Collection"
          filter={{
            limit: 8,
            featured: true,
          }}
        />

        {/* Separator line */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <hr className="border-t border-gray-100" />
        </div>

        {/* 4. Trending Deals */}
        <ProductRail
          title="Trending Deals"
          filter={{
            limit: 8,
            sortBy: "rating",
            sortOrder: "desc",
          }}
        />

      </div>
    </div>
  );
}

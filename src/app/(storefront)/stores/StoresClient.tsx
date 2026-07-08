"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, Store as StoreIcon } from "lucide-react";
import { useStores } from "@/lib/hooks/useStores";
import StoreCard from "@/components/storefront/StoreCard";
import { Store } from "@/lib/types";

export default function StoresClient() {
  const { data: stores = [], isLoading } = useStores();
  const [search, setSearch] = useState("");

  const filteredStores = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return stores;
    return stores.filter(
      (s: Store) =>
        s.name.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
    );
  }, [stores, search]);

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 flex-wrap">
          <Link href="/" className="hover:text-black transition-colors font-medium">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-black font-semibold">Stores</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-gray-100 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-black flex items-center gap-2">
              <StoreIcon className="h-6 w-6 sm:h-7 sm:w-7 text-pink-500" />
              Explore Stores
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 font-semibold">
              {isLoading
                ? "Loading vendors…"
                : `Shop directly from ${filteredStores.length} verified vendor${
                    filteredStores.length === 1 ? "" : "s"
                  }`}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stores…"
              className="w-full h-10 pl-9 pr-4 text-sm rounded-full border border-gray-200 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-colors"
            />
          </div>
        </div>

        {/* Store Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-[16/11] bg-gray-50 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <StoreIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1">
              No stores found
            </h3>
            <p className="text-sm text-gray-550">
              {search
                ? "Try a different search term."
                : "New vendors are joining soon — check back later."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredStores.map((store: Store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

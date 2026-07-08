"use client";

import React from "react";
import Link from "next/link";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { useProductsByIds } from "@/lib/hooks/useProducts";
import ProductCard from "@/components/storefront/ProductCard";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { Product } from "@/lib/types";

export default function WishlistPage() {
  const { ids, setIds } = useWishlistStore();
  // Fetch wishlisted products directly by their IDs so saved items always show,
  // even when outside the default product query window.
  const { data: wishlistProducts = [], isLoading } = useProductsByIds(ids);

  const handleClearWishlist = () => {
    setIds([]);
  };

  return (
    <main className="min-h-screen bg-gray-50/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink-700 uppercase tracking-wide">
              My Wishlist
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {wishlistProducts.length} {wishlistProducts.length === 1 ? "item" : "items"} saved in your collection
            </p>
          </div>

          {wishlistProducts.length > 0 && (
            <button
              onClick={handleClearWishlist}
              className="inline-flex items-center justify-center px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold rounded-sm text-xs uppercase tracking-wider transition-colors focus:outline-none"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Wishlist
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-sm border border-gray-100 overflow-hidden shadow-2xs aspect-[4/5] animate-pulse flex flex-col p-4 space-y-4"
              >
                <div className="flex-1 bg-gray-100 rounded-sm" />
                <div className="h-4 bg-gray-100 rounded-md w-1/3" />
                <div className="h-6 bg-gray-100 rounded-md w-3/4" />
                <div className="h-5 bg-gray-100 rounded-md w-1/4" />
              </div>
            ))}
          </div>
        ) : wishlistProducts.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-sm border border-gray-100 p-12 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-10 w-10 text-gray-350" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
              Items you add to your wishlist will appear here. They are automatically saved and synced to your profile so you can access them anytime, anywhere.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-sm text-sm uppercase tracking-wider transition-all"
            >
              Discover Products
            </Link>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {wishlistProducts.map((product: Product) => (
              <div key={product.id} className="relative group">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

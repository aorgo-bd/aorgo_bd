"use client";

import React from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { Product } from "@/lib/types";

interface StickyMobileCTAProps {
  product: Product;
  selectedSize: string;
  selectedColor: string;
  onAddToCart: () => void;
  isWishlisted: boolean;
  onWishlistToggle: () => void;
  isAvailable: boolean;
}

export default function StickyMobileCTA({
  product,
  selectedSize,
  selectedColor,
  onAddToCart,
  isWishlisted,
  onWishlistToggle,
  isAvailable,
}: StickyMobileCTAProps) {
  const needsSelection =
    (product.variants.some((v) => v.size) && !selectedSize) ||
    (product.variants.some((v) => v.color) && !selectedColor);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.08)] flex items-center gap-3"
    >
      {/* 1. Wishlist Button */}
      <button
        onClick={onWishlistToggle}
        className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
          isWishlisted
            ? "border-red-100 bg-red-50 text-red-600 active:scale-95"
            : "border-gray-200 bg-white text-gray-700 hover:text-black active:scale-95"
        }`}
        aria-label="Toggle Wishlist"
      >
        <Heart className={`h-6 w-6 ${isWishlisted ? "fill-red-600" : ""}`} />
      </button>

      {/* 2. Add to Cart / Out of Stock CTA */}
      <button
        onClick={onAddToCart}
        disabled={!isAvailable}
        className={`flex-1 h-12 rounded-xl font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-xs transition-all ${
          !isAvailable
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : needsSelection
            ? "bg-black text-white hover:bg-black/90 active:scale-[0.98]"
            : "bg-black text-white hover:bg-black/90 active:scale-[0.98]"
        }`}
      >
        <ShoppingBag className="h-4.5 w-4.5" />
        <span>
          {!isAvailable
            ? "Out of Stock"
            : needsSelection
            ? "Select Size/Color"
            : "Add to Cart"}
        </span>
      </button>
    </motion.div>
  );
}

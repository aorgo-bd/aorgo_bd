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
        className={`p-3 rounded-sm border flex items-center justify-center transition-colors ${
          isWishlisted
            ? "border-pink-200 bg-pink-50 text-pink-500 active:scale-95"
            : "border-ink-300 bg-white text-ink-500 hover:text-pink-500 active:scale-95"
        }`}
        aria-label="Toggle Wishlist"
      >
        <Heart className={`h-6 w-6 ${isWishlisted ? "fill-pink-500" : ""}`} />
      </button>

      {/* 2. Add to Bag / Out of Stock CTA */}
      <button
        onClick={onAddToCart}
        disabled={!isAvailable}
        className={`flex-1 h-12 rounded-sm font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-colors ${
          !isAvailable
            ? "bg-ink-200 text-ink-400 cursor-not-allowed"
            : "bg-pink-500 text-white hover:bg-pink-600 active:scale-[0.99]"
        }`}
      >
        <ShoppingBag className="h-4.5 w-4.5" />
        <span>
          {!isAvailable
            ? "Out of Stock"
            : needsSelection
            ? "Select Size/Color"
            : "Add to Bag"}
        </span>
      </button>
    </motion.div>
  );
}

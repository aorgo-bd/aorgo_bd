"use client";

import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Product } from "@/lib/types";
import { ProductImage } from "@/components/ProductImage";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toggle, has } = useWishlistStore();
  const isWishlisted = has(product.id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
    if (!isWishlisted) {
      toast.success(`Added ${product.title} to wishlist!`);
    } else {
      toast.success(`Removed ${product.title} from wishlist.`);
    }
  };

  // Calculate discount percentage if comparePrice exists
  const discount =
    product.discountPercent ||
    (product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0);

  const mainImage = product.images?.[0] || "";

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col w-full bg-white rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow duration-300 border border-gray-100"
    >
      {/* 4:5 Aspect Ratio Image Wrapper */}
      <div className="relative w-full aspect-[4/5] bg-gray-50 overflow-hidden">
        {mainImage ? (
          <ProductImage
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
            No Image
          </div>
        )}

        {/* Wishlist Heart Overlay */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white backdrop-blur-xs text-gray-700 hover:text-black transition-all rounded-full shadow-xs focus:outline-none z-10"
        >
          <Heart
            className={`h-4.5 w-4.5 transition-colors ${
              isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
            }`}
          />
        </button>

        {/* Discount Badge Overlay */}
        {discount > 0 && (
          <span className="absolute bottom-3 left-3 bg-[#FF3333] text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Product Details Section */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between min-h-[120px]">
        <div>
          {/* Brand */}
          <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
            {product.brand}
          </span>
          {/* Title */}
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-black line-clamp-2 leading-snug mb-1">
            {product.title}
          </h3>
        </div>

        {/* Price & Rating */}
        <div className="pt-2 border-t border-gray-50 flex items-end justify-between">
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            <span className="text-base sm:text-lg font-black text-black">
              ৳{product.price}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xs sm:text-sm text-gray-400 line-through">
                ৳{product.comparePrice}
              </span>
            )}
          </div>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center text-[11px] sm:text-xs font-medium text-gray-500">
              <span className="text-amber-500 mr-0.5">★</span>
              <span>{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

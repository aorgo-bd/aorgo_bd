"use client";

import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Product } from "@/lib/types";
import { ProductImage } from "@/components/ProductImage";
import { useWishlistStore } from "@/lib/stores/wishlist";
import toast from "react-hot-toast";

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
      className="group relative flex flex-col w-full bg-white overflow-hidden transition-shadow duration-200 hover:shadow-[0_2px_16px_rgba(40,44,63,0.16)]"
    >
      {/* 3:4 Aspect Ratio Image Wrapper */}
      <div className="relative w-full aspect-[3/4] bg-ink-100 overflow-hidden">
        {mainImage ? (
          <ProductImage
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-ink-100 text-ink-400 text-xs">
            No Image
          </div>
        )}

        {/* Wishlist Heart Overlay */}
        <button
          onClick={handleWishlistToggle}
          aria-label="Add to wishlist"
          className="absolute top-2.5 right-2.5 h-8 w-8 flex items-center justify-center bg-white/95 text-ink-500 hover:text-pink-500 transition-colors rounded-full shadow-[0_1px_4px_rgba(40,44,63,0.16)] focus:outline-none z-10"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isWishlisted ? "fill-pink-500 text-pink-500" : "text-ink-500"
            }`}
          />
        </button>

        {/* Rating pill (Myntra style) bottom-left */}
        {product.rating > 0 && (
          <div className="absolute bottom-0 left-0 m-2 flex items-center gap-1 bg-white/95 px-1.5 py-0.5 rounded-sm shadow-[0_1px_2px_rgba(40,44,63,0.12)]">
            <span className="text-[11px] font-bold text-ink-700 leading-none">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-brand-green text-[10px] leading-none">★</span>
            {product.reviewCount > 0 && (
              <>
                <span className="w-px h-2.5 bg-ink-300" />
                <span className="text-[10px] font-semibold text-ink-400 leading-none">
                  {product.reviewCount > 999
                    ? `${(product.reviewCount / 1000).toFixed(1)}k`
                    : product.reviewCount}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Product Details Section */}
      <div className="px-2.5 pt-2 pb-3 flex flex-col">
        {/* Brand */}
        <h3 className="text-sm font-bold text-ink-700 truncate leading-tight">
          {product.brand}
        </h3>
        {/* Title / description (one line, muted — Myntra style) */}
        <p className="text-[13px] text-ink-500 truncate leading-tight mt-0.5">
          {product.title}
        </p>

        {/* Price row */}
        <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
          <span className="text-sm font-bold text-ink-700">
            ৳{product.price.toLocaleString("en-BD")}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs text-ink-400 line-through">
              ৳{product.comparePrice.toLocaleString("en-BD")}
            </span>
          )}
          {discount > 0 && (
            <span className="text-xs font-bold text-brand-orange">
              ({discount}% OFF)
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

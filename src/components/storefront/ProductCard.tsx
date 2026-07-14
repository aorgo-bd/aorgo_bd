"use client";

import React from "react";
import Link from "next/link";
import { Heart, Star, BadgePercent } from "lucide-react";
import { Product } from "@/lib/types";
import { ProductImage } from "@/components/ProductImage";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { colorToHex, getDiscountPercent, isLightColor } from "@/lib/utils";
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

  const discount = getDiscountPercent(product);
  const mainImage = product.images?.[0] || "";

  // Unique variant colors → real swatches (spec #3). Cap to keep the card tidy.
  const colors = Array.from(
    new Set(
      (product.variants || [])
        .map((v) => v.color)
        .filter((c) => c && c.toLowerCase() !== "default")
    )
  );

  // Stock status derived from variants (spec #14).
  const totalStock = (product.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);
  const isSoldOut = product.variants && product.variants.length > 0 && totalStock <= 0;

  // Optional coupon (data-driven — only shown when the product carries one).
  const hasCoupon =
    typeof product.couponPrice === "number" &&
    product.couponPrice > 0 &&
    product.couponPrice < product.price;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative flex flex-col w-full bg-white rounded-2xl overflow-hidden border border-ink-100 shadow-[0_1px_3px_rgba(40,44,63,0.06)] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(40,44,63,0.14)] hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative w-full aspect-[3/4] bg-ink-50 overflow-hidden">
        {mainImage ? (
          <ProductImage
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-ink-100 text-ink-400 text-xs">
            No Image
          </div>
        )}

        {/* Discount badge (top-left) */}
        {discount > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-brand-orange to-pink-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-full shadow-sm leading-none">
            {discount}% OFF
          </span>
        )}

        {/* Sold-out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-ink-700 bg-white px-3 py-1 rounded-full shadow-sm">
              Sold Out
            </span>
          </div>
        )}

        {/* Wishlist heart */}
        <button
          onClick={handleWishlistToggle}
          aria-label="Add to wishlist"
          className="absolute top-2.5 right-2.5 h-9 w-9 flex items-center justify-center bg-white/95 backdrop-blur text-ink-500 hover:text-pink-500 transition-colors rounded-full shadow-[0_1px_6px_rgba(40,44,63,0.16)] focus:outline-none z-10"
        >
          <Heart
            className={`h-4 w-4 transition-all ${
              isWishlisted ? "fill-pink-500 text-pink-500 scale-110" : "text-ink-500"
            }`}
          />
        </button>
      </div>

      {/* Details */}
      <div className="px-3 pt-2.5 pb-3 flex flex-col gap-1">
        {/* Rating */}
        {product.rating > 0 ? (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.round(product.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-ink-200 text-ink-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-ink-700 leading-none ml-0.5">
              {product.rating.toFixed(1)}
            </span>
            {product.reviewCount > 0 && (
              <span className="text-[11px] text-ink-400 leading-none">
                ({product.reviewCount > 999
                  ? `${(product.reviewCount / 1000).toFixed(1)}k`
                  : product.reviewCount})
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-ink-300 leading-none h-3">New</span>
        )}

        {/* Brand (bold) */}
        <h3 className="text-sm font-extrabold text-ink-900 truncate leading-tight">
          {product.brand}
        </h3>

        {/* Product name (muted) */}
        <p className="text-[13px] text-ink-500 truncate leading-tight">
          {product.title}
        </p>

        {/* Price row */}
        <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
          <span className="text-[15px] font-extrabold text-ink-900">
            ৳{product.price.toLocaleString("en-BD")}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs text-ink-400 line-through">
              ৳{product.comparePrice.toLocaleString("en-BD")}
            </span>
          )}
          {discount > 0 && (
            <span className="text-xs font-bold text-brand-orange">{discount}% OFF</span>
          )}
        </div>

        {/* Coupon price */}
        {hasCoupon && (
          <div className="flex items-center gap-1.5 mt-1 bg-emerald-50 text-emerald-700 rounded-lg px-2 py-1 w-fit max-w-full">
            <BadgePercent className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[11px] font-bold leading-none truncate">
              ৳{product.couponPrice!.toLocaleString("en-BD")}
              {product.couponCode && (
                <span className="font-semibold text-emerald-600/90"> with {product.couponCode}</span>
              )}
            </span>
          </div>
        )}

        {/* Color swatches */}
        {colors.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {colors.slice(0, 5).map((color) => (
              <span
                key={color}
                title={color}
                className={`h-4 w-4 rounded-full border ${
                  isLightColor(color) ? "border-ink-300" : "border-black/10"
                }`}
                style={{ backgroundColor: colorToHex(color) }}
              />
            ))}
            {colors.length > 5 && (
              <span className="text-[10px] font-bold text-ink-400">+{colors.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

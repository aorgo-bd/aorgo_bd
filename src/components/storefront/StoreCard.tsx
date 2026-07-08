"use client";

import React from "react";
import Link from "next/link";
import { Star, Package, ArrowRight } from "lucide-react";
import { Store } from "@/lib/types";
import { ProductImage } from "@/components/ProductImage";

interface StoreCardProps {
  store: Store;
}

export default function StoreCard({ store }: StoreCardProps) {
  const banner = store.bannerPublicId || "";
  const logo = store.logoPublicId || "";

  return (
    <Link
      href={`/stores/${store.slug}`}
      className="group flex flex-col w-full bg-white rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow duration-300 border border-gray-100"
    >
      {/* Banner */}
      <div className="relative w-full aspect-[16/7] bg-gray-50 overflow-hidden">
        {banner ? (
          <ProductImage
            src={banner}
            alt={`${store.name} banner`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-ink-100" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start gap-3 -mt-10 relative z-10">
          {/* Logo avatar */}
          <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden border-2 border-white bg-white shadow-sm">
            {logo ? (
              <ProductImage
                src={logo}
                alt={`${store.name} logo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-pink-500 text-white font-black text-lg">
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="pt-9 min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-black truncate">
              {store.name}
            </h3>
          </div>
        </div>

        {store.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-2 leading-relaxed">
            {store.description}
          </p>
        )}

        {/* Stats */}
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-gray-500 font-semibold">
            {store.rating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {store.rating.toFixed(1)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5 text-gray-400" />
              {store.totalProducts} item{store.totalProducts === 1 ? "" : "s"}
            </span>
          </div>
          <span className="flex items-center gap-1 text-pink-500 font-bold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
            Visit <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

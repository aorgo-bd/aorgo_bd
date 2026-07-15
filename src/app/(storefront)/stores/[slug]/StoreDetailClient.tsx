"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Star,
  Package,
  ShoppingBag,
  Mail,
  Phone,
  BadgeCheck,
} from "lucide-react";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaGlobe } from "react-icons/fa";
import { useStoreBySlug } from "@/lib/hooks/useStores";
import { useStoreProducts } from "@/lib/hooks/useProducts";
import { ProductImage } from "@/components/ProductImage";
import ProductCard from "@/components/storefront/ProductCard";
import SortDropdown from "@/components/storefront/SortDropdown";
import { Product } from "@/lib/types";

interface StoreDetailClientProps {
  slug: string;
}

export default function StoreDetailClient({ slug }: StoreDetailClientProps) {
  const { data: store, isLoading: isLoadingStore } = useStoreBySlug(slug);
  const { data: products = [], isLoading: isLoadingProducts } = useStoreProducts(
    store?.id || ""
  );
  const [sortBy, setSortBy] = useState<string>("newest");

  const sortedProducts = useMemo(() => {
    const list = [...products];
    switch (sortBy) {
      case "price-asc":
        return list.sort((a, b) => a.price - b.price);
      case "price-desc":
        return list.sort((a, b) => b.price - a.price);
      case "rating-desc":
        return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "popular":
        return list.sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
      case "newest":
      default:
        return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
  }, [products, sortBy]);

  if (isLoadingStore) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-48 sm:h-64 bg-gray-200 rounded-2xl mb-8" />
        <div className="h-6 bg-gray-200 rounded-md w-48 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/5] bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!store) {
    notFound();
  }

  const banner = store.bannerPublicId || "";
  const logo = store.logoPublicId || "";

  return (
    <div className="min-h-screen pb-20">
      {/* Banner */}
      <div className="relative w-full aspect-[16/6] sm:aspect-[16/5] max-h-[340px] bg-gray-100 overflow-hidden">
        {banner ? (
          <ProductImage
            src={banner}
            alt={`${store.name} banner`}
            priority
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-ink-100" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Store header card */}
        <div className="relative -mt-12 sm:-mt-16 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
          {/* Logo */}
          <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl overflow-hidden border-2 border-white bg-white shadow-md -mt-10 sm:mt-0">
            {logo ? (
              <ProductImage
                src={logo}
                alt={`${store.name} logo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-pink-500 text-white font-black text-2xl">
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-black">
                {store.name}
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </span>
            </div>

            {store.description && (
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed max-w-2xl">
                {store.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center flex-wrap gap-x-5 gap-y-2 mt-3 text-xs sm:text-sm font-semibold text-gray-600">
              {store.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {store.rating.toFixed(1)}
                  <span className="text-gray-400 font-medium">
                    ({store.reviewCount})
                  </span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Package className="h-4 w-4 text-gray-400" />
                {products.length} product{products.length === 1 ? "" : "s"}
              </span>
              {store.totalSales > 0 && (
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-gray-400" />
                  {store.totalSales.toLocaleString("en-BD")} sold
                </span>
              )}
            </div>

            {/* Contact */}
            {(store.contact?.email || store.contact?.phone) && (
              <div className="flex items-center flex-wrap gap-x-5 gap-y-1.5 mt-3 text-xs text-gray-400 font-medium">
                {store.contact?.email && (
                  <a
                    href={`mailto:${store.contact.email}`}
                    className="flex items-center gap-1.5 hover:text-pink-500 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" /> {store.contact.email}
                  </a>
                )}
                {store.contact?.phone && (
                  <a
                    href={`tel:${store.contact.phone}`}
                    className="flex items-center gap-1.5 hover:text-pink-500 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" /> {store.contact.phone}
                  </a>
                )}
              </div>
            )}

            {/* Social links */}
            {store.socialLinks &&
              (store.socialLinks.facebook ||
                store.socialLinks.instagram ||
                store.socialLinks.whatsapp ||
                store.socialLinks.website) && (
                <div className="flex items-center gap-2.5 mt-3">
                  {store.socialLinks.facebook && (
                    <a
                      href={store.socialLinks.facebook}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Facebook"
                      className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-blue-500 hover:text-white transition-colors"
                    >
                      <FaFacebookF className="h-4 w-4" />
                    </a>
                  )}
                  {store.socialLinks.instagram && (
                    <a
                      href={store.socialLinks.instagram}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                      className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-pink-500 hover:text-white transition-colors"
                    >
                      <FaInstagram className="h-4 w-4" />
                    </a>
                  )}
                  {store.socialLinks.whatsapp && (
                    <a
                      href={
                        store.socialLinks.whatsapp.startsWith("http")
                          ? store.socialLinks.whatsapp
                          : `https://wa.me/${store.socialLinks.whatsapp.replace(/[^0-9]/g, "")}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      aria-label="WhatsApp"
                      className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-500 hover:text-white transition-colors"
                    >
                      <FaWhatsapp className="h-4 w-4" />
                    </a>
                  )}
                  {store.socialLinks.website && (
                    <a
                      href={store.socialLinks.website}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Website"
                      className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <FaGlobe className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-gray-500 mt-8 mb-6 flex-wrap">
          <Link href="/" className="hover:text-black transition-colors font-medium">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <Link
            href="/stores"
            className="hover:text-black transition-colors font-medium"
          >
            Stores
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-black font-semibold truncate max-w-[160px]">
            {store.name}
          </span>
        </nav>

        {/* Products */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
          <h2 className="text-lg sm:text-xl font-extrabold text-black">
            Products from {store.name}
          </h2>
          {sortedProducts.length > 0 && (
            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <span className="text-xs sm:text-sm text-gray-450 font-bold">
                Sort by:
              </span>
              <SortDropdown value={sortBy} onChange={setSortBy} />
            </div>
          )}
        </div>

        {isLoadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[4/5] bg-gray-50 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1">
              No products yet
            </h3>
            <p className="text-sm text-gray-550">
              This store hasn&apos;t listed any products yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {sortedProducts.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

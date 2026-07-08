"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import { useCategories } from "@/lib/hooks/useCategories";
import { useProductSearch } from "@/lib/hooks/useProductSearch";
import ProductCard from "@/components/storefront/ProductCard";
import CategoryFilter from "@/components/storefront/CategoryFilter";
import SortDropdown from "@/components/storefront/SortDropdown";

export default function CategoryClient() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { data: categories = [], isLoading: isLoadingCats } = useCategories();

  // Find the current category and its parent if applicable
  const currentCategory = categories.find((c: any) => c.slug === slug);
  const parentCategory = currentCategory?.parent
    ? categories.find((c: any) => c.slug === currentCategory.parent)
    : null;

  const isParentCategory = currentCategory ? !currentCategory.parent : false;

  // Find all child subcategories if this is a parent category
  const subcategories = isParentCategory
    ? categories.filter((c: any) => c.parent === slug)
    : [];

  // Filter States
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "rating-desc" | "popular">("newest");

  // Reset filters when category changes
  useEffect(() => {
    setSelectedSubcategories([]);
    setMinPrice(0);
    setMaxPrice(50000);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSortBy("newest");
  }, [slug]);

  // Construct active filter query for useProductSearch hook
  const activeFilters: any = {
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    colors: selectedColors,
    sizes: selectedSizes,
  };

  if (isParentCategory) {
    // If it's a parent category, we fetch products in either the selected subcategories
    // or if none are selected, all subcategories of this parent
    activeFilters.subcategories =
      selectedSubcategories.length > 0
        ? selectedSubcategories
        : subcategories.map((c: any) => c.slug);
  } else {
    // If it's a child category, fetch products belonging to this specific subcategory only
    activeFilters.category = slug;
  }

  const {
    data,
    isLoading: isLoadingProds,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useProductSearch({
    filters: activeFilters,
    sortBy,
    limitCount: 24,
  });

  const products = data?.pages.flatMap((page) => page.products) || [];

  // Toggle helpers
  const handleSubcategoryToggle = (subSlug: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(subSlug) ? prev.filter((s) => s !== subSlug) : [...prev, subSlug]
    );
  };

  const handleColorToggle = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handlePriceChange = (min: number, max: number) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  const handleClearFilters = () => {
    setSelectedSubcategories([]);
    setMinPrice(0);
    setMaxPrice(50000);
    setSelectedColors([]);
    setSelectedSizes([]);
  };

  if (isLoadingCats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-6 bg-gray-200 rounded-md w-48 mb-8" />
        <div className="flex gap-8">
          <div className="hidden lg:block w-[260px] h-[500px] bg-gray-200 rounded-2xl" />
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[4/5] bg-gray-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-black text-black mb-2">Category Not Found</h2>
        <p className="text-gray-500 mb-6">The category slug you requested does not exist.</p>
        <Link href="/" className="px-6 py-3 bg-black text-white font-bold rounded-full">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 flex-wrap">
          <Link href="/" className="hover:text-black transition-colors font-medium">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          
          {parentCategory ? (
            <>
              <Link
                href={`/category/${parentCategory.slug}`}
                className="hover:text-black transition-colors font-medium"
              >
                {parentCategory.name}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-black font-semibold">
                {currentCategory.name}
              </span>
            </>
          ) : (
            <span className="text-black font-semibold">
              {currentCategory.name}
            </span>
          )}
        </nav>

        {/* Categories Section Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Filters Sidebar */}
          <CategoryFilter
            subcategories={subcategories}
            selectedSubcategories={selectedSubcategories}
            onSubcategoryToggle={handleSubcategoryToggle}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={handlePriceChange}
            selectedColors={selectedColors}
            onColorToggle={handleColorToggle}
            selectedSizes={selectedSizes}
            onSizeToggle={handleSizeToggle}
            onClearFilters={handleClearFilters}
          />

          {/* Product Listing Main Area */}
          <div className="flex-1 w-full">
            
            {/* Header: Title & Sorting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-ink-700 uppercase tracking-wide">
                  {currentCategory.name}
                </h1>
                <p className="text-xs sm:text-sm text-ink-400 mt-1 font-semibold">
                  Showing {products.length} product{products.length === 1 ? "" : "s"}
                </p>
              </div>

              {/* Sort selector */}
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <span className="text-xs sm:text-sm text-gray-450 font-bold">
                  Sort by:
                </span>
                <SortDropdown value={sortBy} onChange={setSortBy} />
              </div>
            </div>

            {/* Product Cards Grid */}
            {isLoadingProds ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="aspect-[3/4] bg-white animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center bg-white border border-ink-200">
                <h3 className="text-base font-bold text-ink-700 mb-1">No products found</h3>
                <p className="text-sm text-ink-500">Try loosening your filters to see more results.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {products.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination (Load More) */}
                {hasNextPage && (
                  <div className="flex justify-center mt-12">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="inline-flex items-center justify-center gap-2 px-10 py-3 bg-white border border-ink-300 hover:border-pink-500 text-ink-700 hover:text-pink-500 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors disabled:opacity-50 min-w-[180px] cursor-pointer"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <span>Load More Products</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

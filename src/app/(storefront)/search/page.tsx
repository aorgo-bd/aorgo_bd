"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronRight, Loader2, ArrowRight, X } from "lucide-react";
import { useCategories } from "@/lib/hooks/useCategories";
import { useProductSearch } from "@/lib/hooks/useProductSearch";
import ProductCard from "@/components/storefront/ProductCard";
import CategoryFilter from "@/components/storefront/CategoryFilter";
import SortDropdown from "@/components/storefront/SortDropdown";
import Link from "next/link";

function SearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQuery = searchParams.get("q") || searchParams.get("search") || "";

  const { data: categories = [], isLoading: isLoadingCats } = useCategories();

  // Filter States
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "rating-desc" | "popular">("newest");

  // Sync category filter if present in URL
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedSubcategories([cat]);
    }
  }, [searchParams]);

  // Construct active filter object for search hook
  const activeFilters: any = {
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    colors: selectedColors,
    sizes: selectedSizes,
    subcategories: selectedSubcategories,
  };

  // Run the search paginated query
  const {
    data,
    isLoading: isLoadingProds,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useProductSearch({
    searchTerm: searchQuery,
    filters: activeFilters,
    sortBy,
    limitCount: 24,
  });

  const products = data?.pages.flatMap((page) => page.products) || [];

  // Filter helpers
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

  // Get all child subcategories for display in CategoryFilter checklist
  const filterSubcategories = categories.filter((c: any) => c.parent);

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 flex-wrap font-medium">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-black font-bold">Search</span>
        </nav>

        {/* Content Section */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Filter Sidebar */}
          {isLoadingCats ? (
            <div className="hidden lg:block w-[240px] xl:w-[260px] h-[500px] bg-gray-50 rounded-2xl animate-pulse" />
          ) : (
            <CategoryFilter
              subcategories={filterSubcategories}
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
          )}

          {/* Main Search Results Grid */}
          <div className="flex-1 w-full">
            
            {/* Header Title & Sorting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
                  {searchQuery ? `Search results for "${searchQuery}"` : "All Products"}
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 font-semibold">
                  Showing {products.length} product{products.length === 1 ? "" : "s"}
                </p>
              </div>

              {/* Sorting selector */}
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <span className="text-xs sm:text-sm text-gray-450 font-bold">
                  Sort by:
                </span>
                <SortDropdown value={sortBy} onChange={setSortBy} />
              </div>
            </div>

            {/* Active Filters Badges */}
            {(selectedSubcategories.length > 0 ||
              selectedColors.length > 0 ||
              selectedSizes.length > 0 ||
              minPrice > 0 ||
              maxPrice < 50000) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {selectedSubcategories.map((subSlug) => {
                  const catName = categories.find((c: any) => c.slug === subSlug)?.name || subSlug;
                  return (
                    <button
                      key={subSlug}
                      onClick={() => handleSubcategoryToggle(subSlug)}
                      className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-250 text-xs font-bold text-gray-700 rounded-full px-3 py-1.5 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <span>Category: {catName}</span>
                      <X className="h-3 w-3 text-gray-400" />
                    </button>
                  );
                })}

                {selectedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorToggle(color)}
                    className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-255 text-xs font-bold text-gray-700 rounded-full px-3 py-1.5 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <span>Color: {color}</span>
                    <X className="h-3 w-3 text-gray-400" />
                  </button>
                ))}

                {selectedSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSizeToggle(size)}
                    className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-255 text-xs font-bold text-gray-700 rounded-full px-3 py-1.5 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <span>Size: {size}</span>
                    <X className="h-3 w-3 text-gray-400" />
                  </button>
                ))}

                {(minPrice > 0 || maxPrice < 50000) && (
                  <button
                    onClick={() => handlePriceChange(0, 50000)}
                    className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-255 text-xs font-bold text-gray-700 rounded-full px-3 py-1.5 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <span>
                      Price: ৳{minPrice} — ৳{maxPrice}
                    </span>
                    <X className="h-3 w-3 text-gray-400" />
                  </button>
                )}

                <button
                  onClick={handleClearFilters}
                  className="text-xs font-extrabold text-red-650 hover:text-red-700 ml-2 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Product Cards Grid */}
            {isLoadingProds ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-[4/5] bg-gray-50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 p-6">
                <h3 className="text-lg font-black text-gray-900 mb-1">No products found</h3>
                <p className="text-sm text-gray-500 mb-6 font-medium">
                  {searchQuery
                    ? `We couldn't find any products matching "${searchQuery}".`
                    : "Try broadening your filters to find products."}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => router.push("/search")}
                    className="inline-flex items-center gap-1.5 px-6 py-3 bg-black text-white text-xs font-bold rounded-full hover:bg-black/90 transition-colors cursor-pointer"
                  >
                    <span>Browse All Products</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
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
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-black hover:bg-black/90 text-white text-sm font-bold rounded-full transition-colors disabled:opacity-50 min-w-[180px] cursor-pointer"
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

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchInner />
    </Suspense>
  );
}

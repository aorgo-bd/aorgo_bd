"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Star, Heart, ShoppingBag, Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react";

import { useProductBySlug, useProducts } from "@/lib/hooks/useProducts";
import { Category, Product, ProductVariant, Order } from "@/lib/types";
import { useCategories } from "@/lib/hooks/useCategories";
import { useCartStore } from "@/lib/stores/cart";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { useUser } from "@/lib/hooks/useUser";
import { useReviews } from "@/lib/hooks/useReviews";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

import ProductGallery from "@/components/storefront/ProductGallery";
import VariantSelector from "@/components/storefront/VariantSelector";
import StickyMobileCTA from "@/components/storefront/StickyMobileCTA";
import TrustBadges from "@/components/storefront/TrustBadges";
import ReviewList from "@/components/storefront/ReviewList";
import ProductRail from "@/components/storefront/ProductRail";
import ProductCard from "@/components/storefront/ProductCard";

export default function ProductDetailClient() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: product, isLoading, error } = useProductBySlug(slug);
  const { data: allProducts = [] } = useProducts();
  const { data: categoriesList = [] } = useCategories();

  const { user } = useUser();
  const { data: reviews = [] } = useReviews(product?.id || "");

  const { data: userOrders = [] } = useQuery<Order[]>({
    queryKey: ["orders-pdp-check", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("customerUid", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
    },
    enabled: !!user?.uid,
  });

  const eligibleOrder = React.useMemo(() => {
    if (!user || !product || !userOrders.length) return null;
    const deliveredOrdersForProduct = userOrders.filter(
      (order: Order) =>
        order.status === "delivered" &&
        order.items.some((item: any) => item.productId === product.id)
    );
    return deliveredOrdersForProduct.find(
      (order: Order) => !reviews.some((r: any) => r.orderId === order.id && r.customerUid === user.uid)
    );
  }, [user, product, userOrders, reviews]);

  const { add: addItem, setIsOpen: setCartOpen } = useCartStore();
  const { toggle: toggleWishlist, has: hasWishlist } = useWishlistStore();

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  const lookScrollRef = useRef<HTMLDivElement>(null);

  const isWishlisted = hasWishlist(product?.id || "");

  // Reset selections when product changes
  useEffect(() => {
    setSelectedSize("");
    setSelectedColor("");
    setQuantity(1);
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="h-4 bg-gray-200 rounded-md w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Gallery skeleton */}
          <div className="lg:col-span-7 aspect-[4/5] bg-gray-200 rounded-2xl" />
          {/* Info skeleton */}
          <div className="lg:col-span-5 space-y-6">
            <div className="h-4 bg-gray-200 rounded-md w-1/4" />
            <div className="h-10 bg-gray-200 rounded-md w-3/4" />
            <div className="h-6 bg-gray-200 rounded-md w-1/3" />
            <div className="h-20 bg-gray-200 rounded-2xl" />
            <div className="h-12 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-black text-gray-900 mb-4 uppercase">
          Product Not Found
        </h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          We couldn&apos;t find the product you&apos;re looking for. It may have been removed or the link is incorrect.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center px-6 py-3 bg-black hover:bg-black/90 text-white font-bold rounded-full transition-colors uppercase text-sm tracking-wide"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  // Calculate stock levels
  const getActiveVariant = () => {
    return product.variants.find(
      (v: ProductVariant) =>
        (v.size === selectedSize || (!v.size && !selectedSize)) &&
        (v.color === selectedColor || (!v.color && !selectedColor))
    );
  };

  const totalStock = product.variants.reduce((acc: number, v: ProductVariant) => acc + (v.stock || 0), 0);
  const selectedVariant = getActiveVariant();
  const currentStock = selectedVariant ? selectedVariant.stock : totalStock;
  const isAvailable = totalStock > 0;

  // Breadcrumbs builder
  const getBreadcrumbs = () => {
    const crumbs = [{ name: "Home", url: "/" }];
    if (!product.category) return crumbs;

    const buildPath = (categorySlug: string) => {
      const list: { name: string; url: string }[] = [];
      let currentSlug: string | null = categorySlug;
      const visited = new Set<string>();

      while (currentSlug && !visited.has(currentSlug)) {
        visited.add(currentSlug);
        const cat = categoriesList.find((c: Category) => c.slug === currentSlug);
        if (cat) {
          list.unshift({ name: cat.name, url: `/category/${cat.slug}` });
          currentSlug = cat.parent || null;
        } else {
          const dashIdx = currentSlug.lastIndexOf("-");
          if (dashIdx !== -1) {
            const leaf = currentSlug.substring(dashIdx + 1);
            list.unshift({
              name: leaf.charAt(0).toUpperCase() + leaf.slice(1),
              url: `/category/${currentSlug}`,
            });
            currentSlug = currentSlug.substring(0, dashIdx);
          } else {
            list.unshift({
              name: currentSlug.charAt(0).toUpperCase() + currentSlug.slice(1),
              url: `/category/${currentSlug}`,
            });
            currentSlug = null;
          }
        }
      }
      return list;
    };

    crumbs.push(...buildPath(product.category));
    crumbs.push({ name: product.title, url: "" });
    return crumbs;
  };

  const handleAddToCart = () => {
    const hasSizes = product.variants.some((v: ProductVariant) => v.size);
    if (hasSizes && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    const hasColors = product.variants.some((v: ProductVariant) => v.color);
    if (hasColors && !selectedColor) {
      toast.error("Please select a color");
      return;
    }

    const variant = getActiveVariant();
    if (!variant) {
      toast.error("Selected variant option is unavailable");
      return;
    }

    if (variant.stock <= 0) {
      toast.error("This variant is out of stock");
      return;
    }

    addItem({
      productId: product.id,
      variantSku: variant.sku,
      title: product.title,
      imagePublicId: variant.imagePublicId || product.images?.[0] || "",
      size: selectedSize || "",
      color: selectedColor || "",
      qty: quantity,
      price: product.price,
      brand: product.brand,
    });
    setCartOpen(true);
    toast.success(`${product.title} added to cart!`);
  };

  const handleBuyNow = () => {
    const hasSizes = product.variants.some((v: ProductVariant) => v.size);
    if (hasSizes && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    const hasColors = product.variants.some((v: ProductVariant) => v.color);
    if (hasColors && !selectedColor) {
      toast.error("Please select a color");
      return;
    }

    const variant = getActiveVariant();
    if (!variant) {
      toast.error("Selected variant option is unavailable");
      return;
    }

    if (variant.stock <= 0) {
      toast.error("This variant is out of stock");
      return;
    }

    addItem({
      productId: product.id,
      variantSku: variant.sku,
      title: product.title,
      imagePublicId: variant.imagePublicId || product.images?.[0] || "",
      size: selectedSize || "",
      color: selectedColor || "",
      qty: quantity,
      price: product.price,
      brand: product.brand,
    });

    router.push("/cart");
  };

  const handleWishlistToggle = () => {
    if (product) {
      toggleWishlist(product.id);
      if (!isWishlisted) {
        toast.success(`Added ${product.title} to wishlist!`);
      } else {
        toast.success(`Removed ${product.title} from wishlist.`);
      }
    }
  };

  // Filter "Complete the Look" products (same store, different category, exclude current)
  const completeTheLookProducts = allProducts
    .filter(
      (p: Product) =>
        p.storeId === product.storeId &&
        p.category !== product.category &&
        p.id !== product.id
    )
    .slice(0, 8);

  // Discount percentage helper
  const discount =
    product.discountPercent ||
    (product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0);

  const scrollLookLeft = () => {
    if (lookScrollRef.current) {
      lookScrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollLookRight = () => {
    if (lookScrollRef.current) {
      lookScrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  const crumbs = getBreadcrumbs();

  return (
    <main className="min-h-screen bg-white">
      {/* PDP Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center flex-wrap gap-1 text-[11px] sm:text-xs text-gray-400 font-medium mb-6 uppercase tracking-wider">
          {crumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.name + idx}>
              {idx > 0 && <span className="text-[10px] text-gray-300">/</span>}
              {crumb.url ? (
                <Link
                  href={crumb.url}
                  className="hover:text-black hover:underline transition-colors"
                >
                  {crumb.name}
                </Link>
              ) : (
                <span className="text-gray-800 font-semibold truncate max-w-[200px]">
                  {crumb.name}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Main Grid: Left Gallery / Right Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-16">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7">
            <ProductGallery images={product.images} title={product.title} />
          </div>

          {/* Right Column: Product Detail Pane */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Title & Brand Header */}
            <div>
              <span className="text-xs sm:text-sm font-extrabold text-gray-400 uppercase tracking-widest block mb-1.5">
                {product.brand}
              </span>
              <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
                {product.title}
              </h1>
            </div>

            {/* Rating Stars Summary */}
            <div className="flex flex-wrap items-center gap-3">
              {product.rating > 0 ? (
                <div className="flex items-center gap-1.5 py-1 px-2.5 bg-gray-50 border border-gray-100 rounded-full w-fit">
                  <span className="text-xs font-bold text-gray-900">
                    {product.rating.toFixed(1)}
                  </span>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] text-gray-300">|</span>
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    {product.reviewCount} review{product.reviewCount !== 1 ? "s" : ""}
                  </span>
                </div>
              ) : null}
              {eligibleOrder && (
                <Link
                  href={`/orders/${eligibleOrder.id}`}
                  className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1.5 uppercase tracking-wider bg-emerald-50/50 border border-emerald-100/50 rounded-full px-3 py-1"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Write a review</span>
                </Link>
              )}
            </div>

            {/* Pricing Details */}
            <div className="flex items-end gap-3.5">
              <span className="text-2xl sm:text-4xl font-black text-black leading-none">
                ৳{product.price}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-sm sm:text-lg text-gray-400 line-through leading-none">
                  ৳{product.comparePrice}
                </span>
              )}
              {discount > 0 && (
                <span className="text-xs sm:text-sm font-extrabold text-[#FF3333] uppercase tracking-wider bg-red-50 border border-red-100/50 py-1 px-2.5 rounded-full leading-none">
                  ({discount}% OFF)
                </span>
              )}
            </div>

            {/* Variant Selector */}
            <VariantSelector
              variants={product.variants}
              selectedSize={selectedSize}
              onSizeChange={setSelectedSize}
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
            />

            {/* Quantity Selector */}
            {isAvailable && (
              <div className="space-y-3">
                <span className="text-sm font-bold text-gray-900 uppercase tracking-wider block">
                  Quantity
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      disabled={quantity <= 1}
                      className="p-3 text-gray-500 hover:text-black transition-colors disabled:opacity-30 disabled:hover:text-gray-550"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 font-bold text-sm text-gray-900 select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((prev) => Math.min(currentStock, prev + 1))}
                      disabled={quantity >= currentStock}
                      className="p-3 text-gray-500 hover:text-black transition-colors disabled:opacity-30 disabled:hover:text-gray-550"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">
                    {currentStock > 0 ? `${currentStock} pieces left` : "Out of stock"}
                  </span>
                </div>
              </div>
            )}

            {/* Stock Warning */}
            {!isAvailable && (
              <div className="p-4 bg-red-50/70 border border-red-100 rounded-2xl text-red-700 text-sm font-bold flex items-center justify-center">
                Sold Out — This item is currently unavailable
              </div>
            )}

            {/* Desktop Action Buttons */}
            {isAvailable && (
              <div className="hidden lg:flex items-center gap-3.5 pt-2">
                {/* 1. Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 h-14 bg-black hover:bg-black/90 text-white rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md"
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span>Add to Cart</span>
                </button>

                {/* 2. Buy Now */}
                <button
                  onClick={handleBuyNow}
                  className="flex-1 h-14 bg-white border-2 border-black hover:bg-gray-50 text-black rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span>Buy Now</span>
                </button>

                {/* 3. Wishlist heart */}
                <button
                  onClick={handleWishlistToggle}
                  className={`h-14 w-14 rounded-xl border flex items-center justify-center transition-all ${
                    isWishlisted
                      ? "border-red-150 bg-red-50 text-red-600 hover:bg-red-100/70"
                      : "border-gray-200 bg-white text-gray-700 hover:text-black hover:border-gray-300"
                  }`}
                  aria-label="Toggle Wishlist"
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-red-600" : ""}`} />
                </button>
              </div>
            )}

            {/* Trust Badges section */}
            <TrustBadges />

            {/* Description & Technical Specifications */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Product Details
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed font-normal">
                  {product.description}
                </p>
              </div>

              {/* Attributes lists */}
              {product.attributes && Object.keys(product.attributes).length > 0 && (
                <div className="grid grid-cols-2 gap-4 bg-gray-50/50 border border-gray-100 rounded-2xl p-4 mt-2">
                  {Object.entries(product.attributes).map(([key, value]) => {
                    if (!value || (Array.isArray(value) && value.length === 0)) return null;
                    return (
                      <div key={key} className="space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {key}
                        </span>
                        <span className="text-xs font-semibold text-gray-900 block capitalize">
                          {Array.isArray(value) ? value.join(", ") : String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Similar Products Rail */}
        <div className="pt-8 border-t border-gray-100">
          <ProductRail
            title="Similar Products"
            filter={{
              category: product.category,
              limit: 8,
            }}
          />
        </div>

        {/* Complete the Look Rail */}
        {completeTheLookProducts.length > 0 && (
          <section className="py-8 relative group border-t border-gray-100">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-black uppercase tracking-tight">
                Complete the Look
              </h2>
              {/* Scroll controls */}
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={scrollLookLeft}
                  className="p-2 rounded-full border border-black/10 bg-white text-black hover:bg-black hover:text-white transition-all shadow-xs"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={scrollLookRight}
                  className="p-2 rounded-full border border-black/10 bg-white text-black hover:bg-black hover:text-white transition-all shadow-xs"
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Horizontal list of matching vendor accessories */}
            <div
              ref={lookScrollRef}
              className="flex space-x-4 sm:space-x-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4 select-none cursor-grab active:cursor-grabbing"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {completeTheLookProducts.map((p: Product) => (
                <div
                  key={p.id}
                  className="min-w-[200px] sm:min-w-[260px] md:min-w-[280px] w-[200px] sm:w-[260px] md:w-[280px] snap-start shrink-0"
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Customer Reviews Section */}
        {eligibleOrder && (
          <div className="mb-6 p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100/60 dark:bg-emerald-950/10 dark:border-emerald-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Share your feedback!</h4>
              <p className="text-xs text-emerald-600 dark:text-emerald-550">
                You purchased this product in order <strong className="font-semibold text-emerald-700 dark:text-emerald-400">#{eligibleOrder.id.slice(-8).toUpperCase()}</strong>.
              </p>
            </div>
            <Link
              href={`/orders/${eligibleOrder.id}`}
              className="inline-flex h-10 items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5 text-xs uppercase tracking-wide transition-colors w-fit shadow-xs shadow-emerald-600/10"
            >
              Write a Review
            </Link>
          </div>
        )}

        <ReviewList productId={product.id} />

      </div>

      {/* Sticky Bottom Actions on Mobile viewport */}
      {isAvailable && (
        <StickyMobileCTA
          product={product}
          selectedSize={selectedSize}
          selectedColor={selectedColor}
          onAddToCart={handleAddToCart}
          isWishlisted={isWishlisted}
          onWishlistToggle={handleWishlistToggle}
          isAvailable={isAvailable}
        />
      )}
    </main>
  );
}

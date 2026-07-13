"use client";

import React from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/stores/cart";
import { ProductImage } from "@/components/ProductImage";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Truck, BadgeCheck } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";

export default function CartPage() {
  const { items, totals, updateQty, remove, clear } = useCartStore();

  const totalItemCount = items.reduce((acc, item) => acc + item.qty, 0);
  const freeShippingProgress = Math.min(
    100,
    Math.round((totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );

  return (
    <main className="min-h-screen bg-ink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-ink-700 tracking-tight">
            Shopping Bag
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            {totalItemCount} {totalItemCount === 1 ? "item" : "items"} in your bag
          </p>
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-ink-200 p-10 sm:p-14 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-20 h-20 bg-ink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-9 w-9 text-ink-300" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-ink-700 mb-2">Your bag is empty</h2>
            <p className="text-ink-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
              Looks like you haven&apos;t added anything yet. Explore Bangladesh&apos;s finest fashion and start filling your bag.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left: Cart Items */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free shipping progress */}
              <div className="bg-white rounded-2xl border border-ink-200 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2.5">
                  <Truck className="h-4 w-4 text-pink-500 shrink-0" />
                  {totals.shipping === 0 ? (
                    <p className="text-sm font-semibold text-ink-700">
                      🎉 You&apos;ve unlocked <span className="text-green-600">FREE shipping!</span>
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-ink-500">
                      Add <span className="font-bold text-ink-700">{formatBDT(FREE_SHIPPING_THRESHOLD - totals.subtotal)}</span> more for{" "}
                      <span className="font-bold text-green-600">FREE shipping</span>
                    </p>
                  )}
                </div>
                <div className="h-1.5 w-full bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Items list — each item is a self-contained card (identical
                  layout on mobile & desktop, so nothing overlaps or collapses). */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.variantSku}
                    className="bg-white rounded-2xl border border-ink-200 shadow-sm p-3 sm:p-4 flex gap-3 sm:gap-4"
                  >
                    {/* Image */}
                    <Link
                      href="/products"
                      className="w-24 sm:w-28 aspect-[4/5] bg-ink-100 rounded-xl overflow-hidden shrink-0 border border-ink-200"
                    >
                      <ProductImage
                        src={item.imagePublicId}
                        alt={item.title}
                        width={224}
                        height={280}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest block">
                            {item.brand}
                          </span>
                          <h3 className="text-sm sm:text-base font-semibold text-ink-700 mt-0.5 line-clamp-2 leading-snug">
                            {item.title}
                          </h3>
                        </div>
                        <button
                          onClick={() => remove(item.variantSku)}
                          className="text-ink-400 hover:text-red-600 p-1.5 -mr-1 -mt-1 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Variant chips */}
                      <div className="flex gap-2 flex-wrap items-center mt-2">
                        {item.size && (
                          <span className="text-[11px] font-semibold text-ink-500 bg-ink-100 rounded-md px-2 py-0.5 uppercase">
                            Size: {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="text-[11px] font-semibold text-ink-500 bg-ink-100 rounded-md px-2 py-0.5 capitalize">
                            {item.color}
                          </span>
                        )}
                      </div>

                      {/* Bottom row: qty selector + line total */}
                      <div className="flex items-center justify-between gap-3 mt-auto pt-3">
                        <div className="flex items-center border border-ink-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQty(item.variantSku, item.qty - 1)}
                            disabled={item.qty <= 1}
                            className="px-2.5 py-2 text-ink-500 hover:bg-ink-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-3 min-w-[2.25rem] text-center font-bold text-sm text-ink-700 select-none">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.variantSku, item.qty + 1)}
                            className="px-2.5 py-2 text-ink-500 hover:bg-ink-100 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-ink-700 leading-none">
                            {formatBDT(item.price * item.qty)}
                          </p>
                          {item.qty > 1 && (
                            <p className="text-[11px] text-ink-400 mt-1">
                              {formatBDT(item.price)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart actions */}
              <div className="flex justify-between items-center px-1 pt-1">
                <button
                  onClick={clear}
                  className="text-xs font-semibold text-ink-400 hover:text-red-600 transition-colors"
                >
                  Clear bag
                </button>
                <Link
                  href="/products"
                  className="text-xs font-semibold text-ink-700 hover:text-pink-500 transition-colors"
                >
                  &larr; Continue shopping
                </Link>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-ink-200 p-5 sm:p-6 shadow-sm">
                <h3 className="text-base font-bold text-ink-700 mb-4">Order Summary</h3>

                <div className="space-y-3 border-b border-ink-200 pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-400">Subtotal ({totalItemCount} items)</span>
                    <span className="text-ink-700 font-semibold">{formatBDT(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-400">Shipping</span>
                    <span className="font-semibold">
                      {totals.shipping === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        <span className="text-ink-700">{formatBDT(totals.shipping)}</span>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-400 leading-relaxed">
                    Shipping is charged per store and finalized at checkout.
                  </p>
                </div>

                {/* Total */}
                <div className="flex items-baseline justify-between py-4">
                  <span className="text-sm font-semibold text-ink-700">Total</span>
                  <span className="text-2xl font-bold text-ink-700">{formatBDT(totals.total)}</span>
                </div>

                {/* COD badge */}
                <div className="flex items-center gap-2.5 p-3 bg-ink-100 rounded-xl mb-4">
                  <BadgeCheck className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-ink-700">Cash on Delivery</p>
                    <p className="text-[11px] text-ink-400 leading-tight">Pay in cash when your order arrives.</p>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="flex w-full bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold text-sm items-center justify-center gap-2 transition-colors active:scale-[0.99] py-4"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Trust block */}
              <div className="bg-white rounded-2xl border border-ink-200 p-4 flex items-center gap-3 shadow-sm">
                <ShieldCheck className="h-5 w-5 text-ink-400 shrink-0" />
                <div className="text-[11px] text-ink-400 leading-normal">
                  <p className="font-bold text-ink-600">100% Quality Assurance</p>
                  <p>All items are vetted and shipped directly from authentic merchant stores.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

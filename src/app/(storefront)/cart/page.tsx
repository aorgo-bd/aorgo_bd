"use client";

import React from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/stores/cart";
import { ProductImage } from "@/components/ProductImage";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const { items, totals, updateQty, remove, clear } = useCartStore();

  const totalItemCount = items.reduce((acc, item) => acc + item.qty, 0);

  return (
    <main className="min-h-screen bg-gray-50/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-black uppercase tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalItemCount} {totalItemCount === 1 ? "item" : "items"} currently in your bag
          </p>
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center max-w-xl mx-auto shadow-xs">
            <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
              Looks like you haven&apos;t added any approved items yet. Head back to the store to explore Bangladesh&apos;s finest fashion.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-8 py-3 bg-black hover:bg-black/90 text-white font-bold rounded-xl text-sm uppercase tracking-wider transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          /* Cart Grid Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left side: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs">
                {/* Header row for large screens */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <div className="col-span-6">Product Details</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <div
                      key={item.variantSku}
                      className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                    >
                      {/* Product details (Image + Title/Variant) */}
                      <div className="col-span-1 md:col-span-6 flex gap-4">
                        <div className="w-20 aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                          <ProductImage
                            src={item.imagePublicId}
                            alt={item.title}
                            width={160}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {item.brand}
                          </span>
                          <h3 className="text-sm font-bold text-gray-900 mt-0.5 line-clamp-2">
                            {item.title}
                          </h3>
                          <div className="flex gap-2 flex-wrap items-center mt-1.5">
                            {item.size && (
                              <span className="text-[10px] font-bold text-gray-600 bg-gray-100 rounded-md px-2 py-0.5 uppercase">
                                Size: {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="text-[10px] font-bold text-gray-600 bg-gray-100 rounded-md px-2 py-0.5 capitalize">
                                Color: {item.color}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-1 md:col-span-2 text-left md:text-center">
                        <span className="text-xs text-gray-400 font-semibold md:hidden">Price: </span>
                        <span className="text-sm font-black text-black">৳{item.price}</span>
                      </div>

                      {/* Quantity Selector */}
                      <div className="col-span-1 md:col-span-2 flex justify-start md:justify-center">
                        <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-2xs">
                          <button
                            onClick={() => updateQty(item.variantSku, item.qty - 1)}
                            disabled={item.qty <= 1}
                            className="p-2 text-gray-500 hover:text-black disabled:opacity-30 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-3 font-bold text-sm text-gray-900 select-none">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.variantSku, item.qty + 1)}
                            className="p-2 text-gray-500 hover:text-black transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Total Price & Delete Button */}
                      <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end gap-4">
                        <div>
                          <span className="text-xs text-gray-400 font-semibold md:hidden">Subtotal: </span>
                          <span className="text-base font-black text-black">৳{item.price * item.qty}</span>
                        </div>
                        <button
                          onClick={() => remove(item.variantSku)}
                          className="text-gray-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Action Buttons */}
              <div className="flex justify-between items-center px-2">
                <button
                  onClick={clear}
                  className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wider py-2 transition-colors"
                >
                  Clear Shopping Cart
                </button>
                <Link
                  href="/products"
                  className="text-xs font-bold text-black hover:underline uppercase tracking-wider py-2"
                >
                  &larr; Keep Shopping
                </Link>
              </div>
            </div>

            {/* Right side: Sticky Order Summary Card */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-6">
                <h3 className="text-base font-bold text-black uppercase tracking-wide">
                  Order Summary
                </h3>

                {/* Subtotal calculations */}
                <div className="space-y-3.5 border-b border-gray-100 pb-5">
                  <div className="flex justify-between text-sm text-gray-500 font-semibold">
                    <span>Subtotal</span>
                    <span className="text-black font-extrabold">৳{totals.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 font-semibold">
                    <span>Shipping Fee</span>
                    <span className="text-black font-extrabold">
                      {totals.shipping === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `৳${totals.shipping}`
                      )}
                    </span>
                  </div>
                  {totals.shipping > 0 && (
                    <p className="text-[10px] text-gray-400 leading-normal">
                      Spend ৳{3000 - totals.subtotal} more to unlock **FREE shipping** in Bangladesh!
                    </p>
                  )}
                </div>

                {/* COD Option description (Hard Constraint check) */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Delivery Payment Mode
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-black"></span>
                    <span className="text-xs font-bold text-gray-900">Cash on Delivery (COD)</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed mt-1.5">
                    Pay with cash when your items arrive at your doorstep. Safe, local, and hassle-free.
                  </p>
                </div>

                {/* Final Total */}
                <div className="flex items-end justify-between">
                  <span className="text-sm font-bold text-black uppercase tracking-wider">Estimated Total</span>
                  <span className="text-2xl font-black text-black">৳{totals.total}</span>
                </div>

                {/* Checkout CTA */}
                <Link
                  href="/checkout"
                  className="flex h-14 w-full bg-black hover:bg-black/90 text-white rounded-2xl font-bold uppercase tracking-wider text-xs items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
              </div>

              {/* Trust block */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-gray-400 shrink-0" />
                <div className="text-[10px] text-gray-500 leading-normal font-normal">
                  <p className="font-bold text-gray-700">100% Quality Assurance</p>
                  <p>All items on AORGO are vetted and shipped directly from authentic merchant stores.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

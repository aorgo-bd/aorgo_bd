"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { useCartStore } from "@/lib/stores/cart";
import { ProductImage } from "@/components/ProductImage";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CartDrawer() {
  const { items, totals, isOpen, setIsOpen, updateQty, remove } = useCartStore();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-md sm:max-w-md bg-white flex flex-col h-full p-0 shadow-2xl border-l border-gray-100"
      >
        {/* Drawer Header */}
        <SheetHeader className="px-6 py-5 border-b border-gray-100 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-black" />
            <SheetTitle className="text-lg font-black text-black uppercase tracking-wide">
              Your Cart
            </SheetTitle>
            <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {items.reduce((acc, item) => acc + item.qty, 0)}
            </span>
          </div>
          <SheetClose className="p-1 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors">
            <span className="sr-only">Close</span>
            <span className="text-xs font-bold uppercase tracking-wider px-2">Close</span>
          </SheetClose>
        </SheetHeader>

        {/* Scrollable Cart Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-gray-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Your cart is empty</h3>
                <p className="text-xs text-gray-400 max-w-[200px] mx-auto mt-1">
                  Add some approved fashion and apparel items to start your style journey.
                </p>
              </div>
              <SheetClose render={
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-sm text-xs uppercase tracking-wider transition-colors"
                >
                  Browse Products
                </Link>
              } />
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.variantSku}
                className="flex gap-4 p-3 bg-white border border-gray-100 rounded-sm shadow-2xs hover:shadow-xs transition-shadow duration-200"
              >
                {/* Product Image */}
                <div className="w-20 aspect-[4/5] bg-gray-50 rounded-sm overflow-hidden shrink-0">
                  <ProductImage
                    src={item.imagePublicId}
                    alt={item.title}
                    width={160}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-h-[90px]">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-1 leading-tight">
                        {item.title}
                      </h4>
                      <button
                        onClick={() => remove(item.variantSku)}
                        className="text-gray-400 hover:text-red-600 p-0.5 rounded-full hover:bg-red-50 transition-colors shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">
                      {item.brand}
                    </span>
                    <div className="flex gap-2 flex-wrap items-center mt-1">
                      {item.size && (
                        <span className="text-[10px] font-bold text-gray-600 bg-gray-100 rounded-md px-1.5 py-0.5 uppercase">
                          Size: {item.size}
                        </span>
                      )}
                      {item.color && (
                        <span className="text-[10px] font-bold text-gray-600 bg-gray-100 rounded-md px-1.5 py-0.5 capitalize">
                          Color: {item.color}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Price */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <div className="flex items-center border border-gray-100 rounded-lg bg-gray-50/50">
                      <button
                        onClick={() => updateQty(item.variantSku, item.qty - 1)}
                        disabled={item.qty <= 1}
                        className="p-1.5 text-gray-500 hover:text-black disabled:opacity-30 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2.5 font-bold text-xs text-gray-900 select-none">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.variantSku, item.qty + 1)}
                        className="p-1.5 text-gray-500 hover:text-black transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="text-sm font-black text-black">
                      ৳{item.price * item.qty}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer (Checkout Block) */}
        {items.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-4">
            {/* Calculation summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-500 font-semibold">
                <span>Subtotal</span>
                <span className="text-black font-extrabold">৳{totals.subtotal}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 font-semibold">
                <span>Shipping Estimate</span>
                <span className="text-black font-extrabold">
                  {totals.shipping === 0 ? "FREE" : `৳${totals.shipping}`}
                </span>
              </div>
              <div className="border-t border-gray-200/60 my-2 pt-2 flex items-end justify-between">
                <span className="text-base font-bold text-black uppercase tracking-wide">Total</span>
                <span className="text-xl font-black text-black">৳{totals.total}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5">
              {/* Primary Checkout CTA */}
              <SheetClose render={
                <Link
                  href="/checkout"
                  className="flex h-12 w-full bg-pink-500 hover:bg-pink-600 text-white rounded-sm font-bold uppercase tracking-wider text-xs items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-md"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              } />

              {/* View Full Cart Page */}
              <SheetClose render={
                <Link
                  href="/cart"
                  className="flex h-12 w-full bg-white border border-gray-200 hover:bg-gray-50 text-black rounded-sm font-bold uppercase tracking-wider text-xs items-center justify-center transition-all active:scale-[0.99]"
                >
                  <span>View Shopping Cart</span>
                </Link>
              } />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

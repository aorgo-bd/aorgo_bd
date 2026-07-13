"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { useCartStore } from "@/lib/stores/cart";
import { ProductImage } from "@/components/ProductImage";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, X, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";

export default function CartDrawer() {
  const { items, totals, isOpen, setIsOpen, updateQty, remove } = useCartStore();
  const totalItemCount = items.reduce((acc, item) => acc + item.qty, 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-md sm:max-w-md bg-ink-100 flex flex-col h-full p-0 shadow-2xl border-l border-ink-200"
      >
        {/* Header */}
        <SheetHeader className="px-5 py-4 bg-white border-b border-ink-200 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-ink-700" />
            <SheetTitle className="text-base font-bold text-ink-700 tracking-tight">
              Your Bag
            </SheetTitle>
            <span className="bg-pink-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              {totalItemCount}
            </span>
          </div>
          <SheetClose className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors">
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" />
          </SheetClose>
        </SheetHeader>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-white border border-ink-200 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-ink-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink-700">Your bag is empty</h3>
                <p className="text-xs text-ink-400 max-w-[220px] mx-auto mt-1">
                  Add some fashion items to start your style journey.
                </p>
              </div>
              <SheetClose render={
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl text-xs transition-colors"
                >
                  Browse Products
                </Link>
              } />
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.variantSku}
                className="flex gap-3 p-3 bg-white border border-ink-200 rounded-xl shadow-sm"
              >
                {/* Image */}
                <div className="w-20 aspect-[4/5] bg-ink-100 rounded-lg overflow-hidden shrink-0 border border-ink-200">
                  <ProductImage
                    src={item.imagePublicId}
                    alt={item.title}
                    width={160}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest block">
                        {item.brand}
                      </span>
                      <h4 className="text-sm font-semibold text-ink-700 line-clamp-2 leading-snug mt-0.5">
                        {item.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => remove(item.variantSku)}
                      className="text-ink-400 hover:text-red-600 p-1 -mt-1 -mr-1 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex gap-1.5 flex-wrap items-center mt-1.5">
                    {item.size && (
                      <span className="text-[10px] font-semibold text-ink-500 bg-ink-100 rounded px-1.5 py-0.5 uppercase">
                        {item.size}
                      </span>
                    )}
                    {item.color && (
                      <span className="text-[10px] font-semibold text-ink-500 bg-ink-100 rounded px-1.5 py-0.5 capitalize">
                        {item.color}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2.5">
                    <div className="flex items-center border border-ink-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQty(item.variantSku, item.qty - 1)}
                        disabled={item.qty <= 1}
                        className="px-2 py-1.5 text-ink-500 hover:bg-ink-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2 min-w-[1.75rem] text-center font-bold text-xs text-ink-700 select-none">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.variantSku, item.qty + 1)}
                        className="px-2 py-1.5 text-ink-500 hover:bg-ink-100 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="text-sm font-bold text-ink-700">
                      {formatBDT(item.price * item.qty)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="bg-white border-t border-ink-200 p-4 space-y-3.5">
            {/* COD note */}
            <div className="flex items-center gap-2 text-[11px] text-ink-500">
              <BadgeCheck className="h-4 w-4 text-green-600 shrink-0" />
              <span className="font-medium">Cash on Delivery available</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-400">Subtotal</span>
                <span className="text-ink-700 font-semibold">{formatBDT(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-400">Shipping</span>
                <span className="font-semibold">
                  {totals.shipping === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    <span className="text-ink-700">{formatBDT(totals.shipping)}</span>
                  )}
                </span>
              </div>
              <div className="border-t border-ink-200 pt-2 mt-1 flex items-baseline justify-between">
                <span className="text-sm font-bold text-ink-700">Total</span>
                <span className="text-lg font-bold text-ink-700">{formatBDT(totals.total)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <SheetClose render={
                <Link
                  href="/checkout"
                  className="flex w-full bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold text-sm items-center justify-center gap-2 py-3.5 transition-colors active:scale-[0.99]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              } />
              <SheetClose render={
                <Link
                  href="/cart"
                  className="flex w-full bg-white border border-ink-200 hover:bg-ink-100 text-ink-700 rounded-xl font-semibold text-sm items-center justify-center py-3 transition-colors active:scale-[0.99]"
                >
                  <span>View Full Bag</span>
                </Link>
              } />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

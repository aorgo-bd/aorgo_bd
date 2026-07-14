"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useCartStore, CartItem } from "@/lib/stores/cart";
import { useUser } from "@/lib/hooks/useUser";
import { AddressForm } from "@/components/storefront/AddressForm";
import { Address } from "@/lib/types";
import { AddressFormData } from "@/lib/schemas";
import { ProductImage } from "@/components/ProductImage";
import {
  ShoppingBag,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  Check,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn, formatBDT } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";

type Step = "cart" | "shipping" | "payment";

// The visible progress bar mirrors the mockups: Shopping → Cart → Checkout →
// Payment. "Shopping" is always complete (the user shopped to get here); the
// remaining three map onto the page's internal steps.
const STEPS: { label: string; step: Step | null }[] = [
  { label: "Shopping", step: null },
  { label: "Cart", step: "cart" },
  { label: "Checkout", step: "shipping" },
  { label: "Payment", step: "payment" },
];

/** Small storefront glyph used on each store group header (inline so we don't
 *  depend on an icon that may be absent from this lucide build). */
function StoreIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
      <path d="M3 9h18" />
      <path d="M9 9v3a3 3 0 0 1-6 0" />
      <path d="M15 9v3a3 3 0 0 1-6 0V9" />
      <path d="M21 9v3a3 3 0 0 1-6 0V9" />
    </svg>
  );
}

/** Banknote glyph for the Cash-on-Delivery option. */
function CashIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

/** Group cart items by their store so the review list reads like the mockups
 *  (a store header followed by that store's items). Falls back to brand when a
 *  storeId isn't present. */
function groupByStore(items: CartItem[]) {
  const groups: { key: string; name: string; items: CartItem[] }[] = [];
  const index: Record<string, number> = {};
  for (const item of items) {
    const key = item.storeId || item.brand || "__store__";
    if (index[key] === undefined) {
      index[key] = groups.length;
      groups.push({ key, name: item.brand || "Store", items: [] });
    }
    groups[index[key]].items.push(item);
  }
  return groups;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totals, updateQty, remove, clear } = useCartStore();
  const { user, isAuthenticated, isLoading: isLoadingUser, firebaseUser } = useUser();

  const [activeTab, setActiveTab] = useState<Step>("cart");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);

  // Set default address if available when user is loaded
  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0 && !selectedAddress) {
      const defaultAddr = user.addresses.find((addr: Address) => addr.isDefault) || user.addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [user, selectedAddress]);

  // Handle redirects or loading states
  if (isLoadingUser) {
    return (
      <main className="min-h-screen bg-pink-50/50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
        <p className="text-ink-400 text-sm font-medium animate-pulse">Loading checkout...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-pink-50/50 px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-ink-200 shadow-sm p-8 text-center space-y-5">
          <div className="h-16 w-16 mx-auto rounded-full bg-pink-50 flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-pink-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-ink-700">Access Checkout</h1>
            <p className="text-ink-400 text-sm leading-relaxed">
              Please sign in to access saved addresses, review items, and place your order.
            </p>
          </div>
          <div className="space-y-2 pt-1">
            <Link
              href="/login?redirect=/checkout"
              className="flex w-full items-center justify-center bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl text-sm py-3 transition-colors"
            >
              Log In to Checkout
            </Link>
            <Link
              href="/cart"
              className="flex w-full items-center justify-center text-ink-400 hover:text-ink-700 text-xs font-semibold py-2 transition-colors"
            >
              Back to Cart
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-pink-50/50 px-4 py-16">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="h-20 w-20 mx-auto rounded-full bg-white border border-ink-200 flex items-center justify-center shadow-sm">
            <ShoppingBag className="h-10 w-10 text-ink-300" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-ink-700">Your checkout is empty</h2>
            <p className="text-ink-400 text-sm">Add items to your cart before proceeding to checkout.</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl text-sm py-3 px-8 transition-colors"
          >
            Shop Products
          </Link>
        </div>
      </main>
    );
  }

  const groups = groupByStore(items);
  const totalItemCount = items.reduce((acc, item) => acc + item.qty, 0);

  // Save (create or edit) an address on the user's profile.
  const handleAddressSubmit = async (data: AddressFormData) => {
    if (!user) return;
    setIsSavingAddress(true);
    try {
      const isEditing = !!editingAddress;
      const savedAddress: Address = {
        id: editingAddress?.id
          ? editingAddress.id
          : typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `addr-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: data.name,
        phone: data.phone,
        area: data.area,
        city: data.city,
        district: data.district,
        postalCode: data.postalCode,
        isDefault: data.isDefault,
      };

      let updatedAddresses = user.addresses ? [...user.addresses] : [];

      // Unset other defaults when this one is marked default.
      if (data.isDefault) {
        updatedAddresses = updatedAddresses.map((addr: Address) => ({
          ...addr,
          isDefault: false,
        }));
      }

      if (isEditing) {
        updatedAddresses = updatedAddresses.map((addr: Address) =>
          addr.id === savedAddress.id ? savedAddress : addr
        );
      } else {
        updatedAddresses.push(savedAddress);
      }

      await updateDoc(doc(db, "users", user.uid), { addresses: updatedAddresses });

      setSelectedAddress(savedAddress);
      setShowNewAddressForm(false);
      setEditingAddress(null);
      toast.success(isEditing ? "Address updated" : "Shipping address saved");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save address");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Remove a saved address from the user's profile.
  const handleDeleteAddress = async (addr: Address) => {
    if (!user || !user.addresses) return;
    try {
      const updatedAddresses = user.addresses.filter((a: Address) => a.id !== addr.id);
      await updateDoc(doc(db, "users", user.uid), { addresses: updatedAddresses });
      if (selectedAddress?.id === addr.id) {
        const next = updatedAddresses.find((a: Address) => a.isDefault) || updatedAddresses[0] || null;
        setSelectedAddress(next);
      }
      toast.success("Address removed");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to remove address");
    }
  };

  const startEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setShowNewAddressForm(true);
  };

  const startAddAddress = () => {
    setEditingAddress(null);
    setShowNewAddressForm(true);
  };

  // Coupon Handler — coupons are a later-phase feature (order totals are
  // recomputed server-side, so we never fake a client-only discount). For now
  // we validate the input and surface an honest "no active coupons" message.
  const handleApplyCoupon = () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponError("Enter a coupon code to apply.");
      return;
    }
    setCouponError("This coupon is invalid or has expired.");
    toast.error("No active coupon codes are available yet.");
  };

  // Contextual primary action for the sticky bar based on the current step.
  const advanceOrPlaceOrder = () => {
    if (activeTab === "cart") {
      setActiveTab("shipping");
    } else if (activeTab === "shipping") {
      if (selectedAddress && !showNewAddressForm) {
        setActiveTab("payment");
      } else {
        toast.error("Please select or save a shipping address first.");
      }
    } else {
      handlePlaceOrder();
    }
  };

  const primaryCtaLabel =
    activeTab === "cart"
      ? "Continue to Checkout"
      : activeTab === "shipping"
      ? "Proceed to Payment"
      : "Confirm Order";

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select or enter a shipping address");
      setActiveTab("shipping");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const idToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("firebase-token="))
        ?.split("=")[1] || "";

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantSku: item.variantSku,
            qty: item.qty,
          })),
          shippingAddress: selectedAddress,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong while placing order");
      }

      toast.success("Order placed successfully via Cash on Delivery!");
      clear();

      if (data.orderIds && data.orderIds.length > 1) {
        router.push(`/profile/orders?placed=${data.orderIds.join(",")}`);
      } else {
        router.push(`/orders/${data.orderId}`);
      }
    } catch (err: any) {
      console.error("Checkout order error:", err);
      toast.error(err.message || "Checkout failed. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Which internal step each progress node maps to, for click-to-navigate.
  const activeIndex = activeTab === "cart" ? 1 : activeTab === "shipping" ? 2 : 3;
  const goToStep = (step: Step | null) => {
    if (!step) return;
    if (step === "shipping" && items.length === 0) return;
    if (step === "payment" && !selectedAddress) {
      toast.error("Please select a shipping address first.");
      return;
    }
    setActiveTab(step);
  };

  return (
    <main className="min-h-screen bg-pink-50/50 pb-28 lg:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/cart"
            className="p-1.5 -ml-1.5 rounded-lg text-ink-500 hover:bg-white hover:text-ink-700 transition-colors"
            aria-label="Back to cart"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-700 tracking-tight">
            {activeTab === "cart" ? "Cart" : activeTab === "shipping" ? "Checkout" : "Payment"}
          </h1>
        </div>

        {/* Progress stepper */}
        <div className="mb-8">
          <div className="flex items-start">
            {STEPS.map((s, i) => {
              const isDone = i < activeIndex;
              const isActive = i === activeIndex;
              const reached = isDone || isActive;
              return (
                <React.Fragment key={s.label}>
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => goToStep(s.step)}
                      disabled={!s.step}
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full text-base font-bold transition-all",
                        reached
                          ? "bg-pink-500 text-white shadow-sm shadow-pink-500/30"
                          : "bg-pink-100 text-pink-300",
                        s.step && "cursor-pointer hover:scale-105",
                        !s.step && "cursor-default"
                      )}
                    >
                      {isDone ? <Check className="h-5 w-5 stroke-[3]" /> : i + 1}
                    </button>
                    <span
                      className={cn(
                        "text-[11px] sm:text-sm font-semibold whitespace-nowrap",
                        reached ? "text-ink-700" : "text-pink-300"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-1 mt-5 mx-1 sm:mx-2 rounded-full overflow-hidden bg-pink-100">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          i < activeIndex ? "bg-pink-500 w-full" : "w-0"
                        )}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Email verification notice */}
        {firebaseUser && !firebaseUser.emailVerified && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              ⚠️ <strong>Email not verified:</strong> Your email (<strong>{firebaseUser.email}</strong>) is
              not verified. Verify it to receive order status updates.
            </div>
            <button
              className="shrink-0 self-start sm:self-center bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg px-3 py-2 transition-colors"
              onClick={async () => {
                try {
                  const { sendEmailVerification } = await import("firebase/auth");
                  await sendEmailVerification(firebaseUser);
                  toast.success("Verification email sent! Check your inbox.");
                } catch (err: any) {
                  toast.error(err.message || "Failed to send verification email");
                }
              }}
            >
              Resend Verification
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Main step column */}
          <div className="lg:col-span-8 space-y-4">
            {/* STEP: CART REVIEW */}
            {activeTab === "cart" && (
              <div className="space-y-4">
                {groups.map((group) => (
                  <div
                    key={group.key}
                    className="bg-white rounded-2xl border border-ink-200 shadow-sm overflow-hidden"
                  >
                    <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3.5 border-b border-ink-200">
                      <StoreIcon className="h-5 w-5 text-pink-500 shrink-0" />
                      <span className="font-bold text-sm text-ink-700">{group.name}</span>
                    </div>
                    <div className="divide-y divide-ink-100">
                      {group.items.map((item) => (
                        <div key={item.variantSku} className="p-4 sm:p-5 flex gap-3 sm:gap-4">
                          <div className="w-20 h-24 sm:w-24 sm:h-28 bg-ink-100 rounded-xl overflow-hidden shrink-0 border border-ink-200">
                            <ProductImage
                              src={item.imagePublicId}
                              alt={item.title}
                              width={192}
                              height={224}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col">
                            <h3 className="text-sm sm:text-base font-semibold text-ink-700 line-clamp-2 leading-snug">
                              {item.title}
                            </h3>
                            <p className="text-base font-bold text-pink-600 mt-1">{formatBDT(item.price)}</p>
                            <div className="flex gap-2 flex-wrap items-center mt-1.5">
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
                            <div className="flex items-center justify-between gap-3 mt-auto pt-3">
                              <button
                                onClick={() => remove(item.variantSku)}
                                className="text-ink-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                aria-label="Remove item"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                              <div className="flex items-center gap-1 bg-ink-100 rounded-full p-1">
                                <button
                                  onClick={() => updateQty(item.variantSku, item.qty - 1)}
                                  disabled={item.qty <= 1}
                                  className="h-7 w-7 flex items-center justify-center rounded-full bg-white text-ink-600 shadow-sm hover:text-pink-600 disabled:opacity-30 disabled:hover:text-ink-600 transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="px-2 min-w-[1.75rem] text-center font-bold text-sm text-ink-700 select-none">
                                  {item.qty}
                                </span>
                                <button
                                  onClick={() => updateQty(item.variantSku, item.qty + 1)}
                                  className="h-7 w-7 flex items-center justify-center rounded-full bg-white text-ink-600 shadow-sm hover:text-pink-600 transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center px-1">
                  <Link
                    href="/cart"
                    className="text-xs font-semibold text-ink-500 hover:text-pink-500 transition-colors"
                  >
                    &larr; Modify Cart
                  </Link>
                  <span className="text-xs text-ink-400">
                    {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>
            )}

            {/* STEP: SHIPPING / CHECKOUT */}
            {activeTab === "shipping" && (
              <div className="space-y-4">
                {/* Add address button */}
                <button
                  onClick={startAddAddress}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pink-300 bg-pink-50/60 hover:bg-pink-50 text-pink-600 font-bold py-5 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Address</span>
                </button>

                {/* New / edit address form */}
                {showNewAddressForm && (
                  <div className="bg-white rounded-2xl border border-ink-200 shadow-sm p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="font-bold text-sm text-ink-700">
                        {editingAddress ? "Edit Address" : "Add a Shipping Address"}
                      </h4>
                      <button
                        className="text-xs font-semibold text-ink-400 hover:text-ink-700 transition-colors"
                        onClick={() => {
                          setShowNewAddressForm(false);
                          setEditingAddress(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                    <AddressForm
                      onSubmit={handleAddressSubmit}
                      isSubmitting={isSavingAddress}
                      submitLabel={editingAddress ? "Update Address" : "Save Address"}
                      defaultValues={editingAddress ?? undefined}
                    />
                  </div>
                )}

                {/* Saved addresses */}
                {!showNewAddressForm && user?.addresses && user.addresses.length > 0 && (
                  <div className="space-y-3">
                    {user.addresses.map((addr: Address) => {
                      const isSelected = selectedAddress?.id === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddress(addr)}
                          className={cn(
                            "bg-white rounded-2xl border shadow-sm p-4 sm:p-5 cursor-pointer transition-all",
                            isSelected ? "border-pink-500 ring-2 ring-pink-500/20" : "border-ink-200 hover:border-pink-300"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Radio */}
                            <span
                              className={cn(
                                "mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                isSelected ? "border-pink-500" : "border-ink-300"
                              )}
                            >
                              {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />}
                            </span>

                            <MapPin className={cn("h-5 w-5 mt-0.5 shrink-0", isSelected ? "text-pink-500" : "text-ink-400")} />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-bold text-sm text-ink-700 truncate">{addr.name}</p>
                                  <p className="text-sm text-ink-500 mt-0.5">{addr.phone}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAddress(addr);
                                    }}
                                    className="text-ink-400 hover:text-red-600 transition-colors"
                                    aria-label="Delete address"
                                  >
                                    <Trash2 className="h-4.5 w-4.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditAddress(addr);
                                    }}
                                    className="text-sm font-bold text-pink-600 hover:text-pink-700 transition-colors"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-ink-500 mt-1.5 leading-relaxed">
                                {addr.area}, {addr.city}, {addr.district} - {addr.postalCode}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-600 bg-pink-50 rounded-full px-2.5 py-1">
                                  <MapPin className="h-3 w-3" />
                                  {addr.district}
                                </span>
                                {addr.isDefault && (
                                  <span className="text-[11px] font-bold text-brand-orange bg-brand-orange/10 rounded-full px-2.5 py-1">
                                    Default Delivery Address
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty address prompt */}
                {!showNewAddressForm && (!user?.addresses || user.addresses.length === 0) && (
                  <div className="bg-white rounded-2xl border border-ink-200 shadow-sm p-8 text-center">
                    <MapPin className="h-8 w-8 text-ink-300 mx-auto mb-3" />
                    <p className="text-sm text-ink-500">
                      No saved addresses yet. Tap <span className="font-semibold text-ink-700">Add Address</span> above to
                      add your delivery location.
                    </p>
                  </div>
                )}

                {/* Item summary on the checkout step */}
                {items.length > 0 && (
                  <div className="bg-white rounded-2xl border border-ink-200 shadow-sm overflow-hidden">
                    <div className="px-4 sm:px-5 py-3.5 border-b border-ink-200">
                      <span className="font-bold text-sm text-ink-700">Order Items ({totalItemCount})</span>
                    </div>
                    <div className="divide-y divide-ink-100">
                      {items.map((item) => (
                        <div key={item.variantSku} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                          <div className="w-12 h-14 bg-ink-100 rounded-lg overflow-hidden shrink-0 border border-ink-200">
                            <ProductImage
                              src={item.imagePublicId}
                              alt={item.title}
                              width={96}
                              height={112}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink-700 truncate">{item.title}</p>
                            <p className="text-xs text-ink-400 mt-0.5">
                              {[item.color, item.size].filter(Boolean).join(" • ")} × {item.qty}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-ink-700 shrink-0">
                            {formatBDT(item.price * item.qty)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coupon */}
                <div className="bg-white rounded-2xl border border-ink-200 shadow-sm p-4 sm:p-5">
                  <label className="block text-sm font-bold text-ink-700 mb-2">Coupon</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError(null);
                      }}
                      placeholder="Enter coupon code"
                      className="flex-1 min-w-0 h-11 rounded-xl border border-ink-200 bg-white px-4 text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-400 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-500/15 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="shrink-0 px-5 rounded-xl bg-pink-100 text-pink-600 font-bold text-sm hover:bg-pink-200 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-red-500 font-medium mt-2">{couponError}</p>}
                </div>
              </div>
            )}

            {/* STEP: PAYMENT */}
            {activeTab === "payment" && (
              <div className="space-y-4">
                {/* Shipping recap */}
                {selectedAddress && (
                  <div className="bg-white rounded-2xl border border-ink-200 shadow-sm p-4 sm:p-5 flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-pink-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-bold text-ink-700">
                        {selectedAddress.name} <span className="font-normal text-ink-500">· {selectedAddress.phone}</span>
                      </p>
                      <p className="text-ink-500 mt-0.5 leading-relaxed">
                        {selectedAddress.area}, {selectedAddress.city}, {selectedAddress.district} -{" "}
                        {selectedAddress.postalCode}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("shipping")}
                      className="text-sm font-bold text-pink-600 hover:text-pink-700 shrink-0"
                    >
                      Change
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-ink-200 shadow-sm p-5 sm:p-6">
                  <h3 className="text-base font-bold text-ink-700 mb-4">Choose Payment Method</h3>
                  <div className="space-y-3">
                    {/* Cash on Delivery — active */}
                    <label className="flex items-center gap-3 rounded-xl border-2 border-pink-500 bg-pink-50/50 p-4 cursor-pointer">
                      <span className="h-5 w-5 rounded-full border-2 border-pink-500 flex items-center justify-center shrink-0">
                        <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-ink-700">Cash on Delivery</p>
                        <p className="text-xs text-ink-400 mt-0.5">Pay in cash when the courier delivers.</p>
                      </div>
                      <CashIcon className="h-6 w-6 text-ink-500 shrink-0" />
                    </label>

                    {/* Online payment — coming soon */}
                    <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50 p-4 opacity-70">
                      <span className="h-5 w-5 rounded-full border-2 border-ink-300 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-ink-500">Online Payment</p>
                        <p className="text-xs text-ink-400 mt-0.5">bKash, Nagad &amp; cards — coming soon.</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-[#0a4da2] px-2 py-1 text-[10px] font-black italic tracking-tight text-white">
                        SSLCOMMERZ
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-ink-400 text-center leading-relaxed mt-4">
                    Online payments are coming soon. For now, every order is placed securely with Cash on Delivery.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-ink-200 shadow-sm p-5 sm:p-6">
              <h3 className="text-base font-bold text-ink-700 mb-4">Summary</h3>

              <div className="space-y-3 border-b border-ink-200 pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-400">Product Price</span>
                  <span className="text-ink-700 font-semibold">{formatBDT(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-400">Standard Delivery</span>
                  <span className="font-semibold">
                    {totals.shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      <span className="text-ink-700">{formatBDT(totals.shipping)}</span>
                    )}
                  </span>
                </div>
                {totals.subtotal > 0 && totals.subtotal <= FREE_SHIPPING_THRESHOLD && (
                  <p className="text-[11px] text-pink-600 bg-pink-50 rounded-lg px-2.5 py-1.5 font-medium">
                    💡 Add {formatBDT(FREE_SHIPPING_THRESHOLD - totals.subtotal)} more for free shipping!
                  </p>
                )}
                <p className="text-[11px] text-ink-400 leading-relaxed">
                  Shipping is charged per store and finalized on the server when you place the order.
                </p>
              </div>

              <div className="flex items-baseline justify-between py-4">
                <span className="text-sm font-bold text-ink-700">Total Payable</span>
                <span className="text-2xl font-bold text-pink-600">{formatBDT(totals.total)}</span>
              </div>

              {/* Desktop primary action */}
              <button
                onClick={advanceOrPlaceOrder}
                disabled={isPlacingOrder || (activeTab === "payment" && !selectedAddress)}
                className="hidden lg:flex w-full items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white rounded-xl font-semibold text-sm py-4 transition-colors active:scale-[0.99]"
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Placing Order...
                  </>
                ) : (
                  <>
                    {primaryCtaLabel}
                    {activeTab !== "payment" && <ChevronRight className="h-4 w-4" />}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-ink-200 px-4 py-3 shadow-[0_-8px_30px_rgba(40,44,63,0.08)] flex items-center gap-4">
        <div className="shrink-0">
          <p className="text-[10px] text-ink-400 font-semibold uppercase tracking-wide leading-none">
            {activeTab === "payment" ? "Total Amount" : "Total Payable"}
          </p>
          <p className="text-lg font-bold text-pink-600 leading-tight">{formatBDT(totals.total)}</p>
        </div>
        <button
          onClick={advanceOrPlaceOrder}
          disabled={isPlacingOrder || (activeTab === "payment" && !selectedAddress)}
          className="flex-1 h-12 flex items-center justify-center gap-1.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors active:scale-[0.99]"
        >
          {isPlacingOrder ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Placing Order...
            </>
          ) : (
            <>
              {primaryCtaLabel}
              {activeTab !== "payment" && <ChevronRight className="h-4 w-4" />}
            </>
          )}
        </button>
      </div>
    </main>
  );
}

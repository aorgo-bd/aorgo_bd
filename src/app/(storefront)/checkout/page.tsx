"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useCartStore } from "@/lib/stores/cart";
import { useUser } from "@/lib/hooks/useUser";
import { AddressForm } from "@/components/storefront/AddressForm";
import { Address } from "@/lib/types";
import { AddressFormData } from "@/lib/schemas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "@/components/ProductImage";
import { ShoppingBag, MapPin, CreditCard, ChevronRight, ChevronLeft, Plus, Check, Loader2 } from "lucide-react";
import { cn, formatBDT } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totals, clear } = useCartStore();
  const { user, isAuthenticated, isLoading: isLoadingUser, firebaseUser } = useUser();

  const [activeTab, setActiveTab] = useState("cart");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading checkout...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-lg mx-auto py-16 px-4">
        <Card className="border-border/60 shadow-lg backdrop-blur-sm bg-background/95">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
              Access Checkout
            </CardTitle>
            <CardDescription>You need to be logged in to complete your checkout</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-center text-sm">
              Please sign in to access saved addresses, review items, and place your order.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Link
              href={`/login?redirect=/checkout`}
              className={cn(buttonVariants({ variant: "default" }), "w-full text-center py-2")}
            >
              Log In to Checkout
            </Link>
            <Link
              href="/cart"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full text-center text-xs text-muted-foreground py-2")}
            >
              Back to Cart
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4 text-center space-y-6">
        <div className="h-20 w-20 mx-auto rounded-full bg-primary/5 flex items-center justify-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Your checkout is empty</h2>
          <p className="text-muted-foreground text-sm">Add items to your cart before proceeding to checkout.</p>
        </div>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "default" }), "py-2 px-4 inline-block")}
        >
          Shop Products
        </Link>
      </div>
    );
  }

  // Address Submit Handler
  const handleAddressSubmit = async (data: AddressFormData) => {
    if (!user) return;
    setIsSavingAddress(true);
    try {
      const newAddress: Address = {
        id: typeof crypto !== "undefined" && "randomUUID" in crypto
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

      if (data.isDefault) {
        // Unset other defaults
        updatedAddresses = updatedAddresses.map((addr: Address) => ({
          ...addr,
          isDefault: false,
        }));
      }

      updatedAddresses.push(newAddress);

      // Save to Firebase profile
      await updateDoc(doc(db, "users", user.uid), {
        addresses: updatedAddresses,
      });

      setSelectedAddress(newAddress);
      setShowNewAddressForm(false);
      toast.success("Shipping address saved successfully");
      
      // Auto advance to Payment tab
      setActiveTab("payment");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save address");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Coupon Handler — coupons are a Phase 1.5 feature (order totals are
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

  // Contextual primary action for the mobile sticky bar based on current step.
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

  const mobileCtaLabel =
    activeTab === "cart"
      ? "Continue"
      : activeTab === "shipping"
      ? "Continue to Payment"
      : "Place Order (COD)";

  // Place Order Handler
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select or enter a shipping address");
      setActiveTab("shipping");
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Get current user id token
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
      clear(); // Clear local storage cart
      
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

  return (
    <div className="container mx-auto max-w-7xl py-6 sm:py-10 px-4 md:px-6 pb-28 lg:pb-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-ink-700 uppercase tracking-wide">Checkout</h1>
        <p className="text-ink-400 text-sm mt-1">Complete your multi-vendor fashion order</p>
      </div>

      {firebaseUser && !firebaseUser.emailVerified && (
        <div className="mb-6 p-4 rounded-sm bg-amber-50 border border-amber-200 text-amber-900 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
          <div>
            ⚠️ <strong>Email Verification Warning:</strong> Your email address (<strong>{firebaseUser.email}</strong>) is not verified. Please verify it to ensure you receive order status updates.
          </div>
          <Button
            size="sm"
            variant="outline"
            className="bg-white border-amber-300 hover:bg-amber-100 text-amber-900 shrink-0 self-start sm:self-center"
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
            Resend Verification Email
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Checkout Steps Form */}
        <div className="lg:col-span-8 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Accessible step progress — the triggers keep Tabs' keyboard/ARIA
                behaviour while reading as a connected checkout stepper. */}
            <TabsList
              aria-label="Checkout steps"
              className="relative grid w-full grid-cols-3 mb-8 h-auto bg-transparent p-0 gap-2 sm:gap-3"
            >
              {[
                { value: "cart", label: "Review Cart", shortLabel: "Cart", icon: ShoppingBag, done: true, disabled: false },
                { value: "shipping", label: "Shipping", shortLabel: "Address", icon: MapPin, done: !!selectedAddress, disabled: items.length === 0 },
                { value: "payment", label: "Payment", shortLabel: "Pay", icon: CreditCard, done: false, disabled: !selectedAddress },
              ].map((step, idx) => {
                const StepIcon = step.icon;
                const isActive = activeTab === step.value;
                const isComplete = step.done && !isActive;
                return (
                  <TabsTrigger
                    key={step.value}
                    value={step.value}
                    disabled={step.disabled}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-2 py-3 text-center transition-all data-[state=active]:border-primary data-[state=active]:bg-primary/[0.04] data-[state=active]:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-border"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors shrink-0",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isComplete
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isComplete ? <Check className="h-4 w-4 stroke-[3]" /> : idx + 1}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] sm:text-sm font-semibold text-muted-foreground group-data-[state=active]:text-foreground">
                      <StepIcon className="h-3.5 w-3.5 shrink-0 hidden sm:inline" />
                      <span className="hidden sm:inline">{step.label}</span>
                      <span className="sm:hidden">{step.shortLabel}</span>
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* TAB 1: REVIEW CART ITEMS */}
            <TabsContent value="cart" className="space-y-4 outline-none">
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Review Cart Items</CardTitle>
                  <CardDescription>Please review the quantity and details of items before shipping.</CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-border/60">
                  {items.map((item) => (
                    <div key={item.variantSku} className="py-4 flex space-x-4 items-center first:pt-0 last:pb-0">
                      <div className="relative h-20 w-16 rounded overflow-hidden bg-muted border shrink-0">
                        <ProductImage
                          src={item.imagePublicId}
                          alt={item.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mb-1">Brand: {item.brand}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                            Size: {item.size}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                            Color: {item.color}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm">{formatBDT(item.price)}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
                        <p className="text-xs font-semibold text-primary mt-1">Total: {formatBDT(item.price * item.qty)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/10 border-t p-6 rounded-b-xl">
                  <Link
                    href="/cart"
                    className={cn(buttonVariants({ variant: "ghost" }), "flex items-center py-2")}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Modify Cart
                  </Link>
                  <Button onClick={() => setActiveTab("shipping")}>
                    Next: Shipping Address <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* TAB 2: SHIPPING ADDRESS */}
            <TabsContent value="shipping" className="space-y-4 outline-none">
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Delivery Address</CardTitle>
                      <CardDescription>Select a delivery location or add a new one.</CardDescription>
                    </div>
                    {!showNewAddressForm && user.addresses && user.addresses.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowNewAddressForm(true)}
                        className="flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add New Address</span>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Saved Addresses List */}
                  {!showNewAddressForm && user.addresses && user.addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.addresses.map((addr: Address) => {
                        const isSelected = selectedAddress?.id === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddress(addr)}
                            className={cn(
                              "border rounded-sm p-4 cursor-pointer transition-all relative flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-600 bg-background/50",
                              isSelected
                                ? "border-primary ring-2 ring-primary/20 bg-primary/[0.02]"
                                : "border-border/60"
                            )}
                          >
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-sm truncate pr-4">{addr.name}</span>
                                {addr.isDefault && (
                                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full uppercase">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-1 font-medium">{addr.phone}</p>
                              <p className="text-xs text-muted-foreground/80 line-clamp-2">
                                {addr.area}, {addr.city}, {addr.district} - {addr.postalCode}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="absolute bottom-3 right-3 h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* Empty state or Form view */}
                  {showNewAddressForm || !user.addresses || user.addresses.length === 0 ? (
                    <div className="border rounded-sm p-6 bg-zinc-50/20 dark:bg-zinc-900/10 border-dashed">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-bold text-sm">Add a Shipping Address</h4>
                        {user.addresses && user.addresses.length > 0 && (
                          <Button size="sm" variant="ghost" onClick={() => setShowNewAddressForm(false)}>
                            Cancel
                          </Button>
                        )}
                      </div>
                      <AddressForm onSubmit={handleAddressSubmit} isSubmitting={isSavingAddress} />
                    </div>
                  ) : null}
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/10 border-t p-6 rounded-b-xl">
                  <Button variant="outline" onClick={() => setActiveTab("cart")}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Back to Cart
                  </Button>
                  {!showNewAddressForm && selectedAddress && (
                    <Button onClick={() => setActiveTab("payment")}>
                      Next: Payment Method <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>

            {/* TAB 3: PAYMENT METHOD */}
            <TabsContent value="payment" className="space-y-4 outline-none">
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Payment Methods</CardTitle>
                  <CardDescription>Select how you want to pay for your products.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Shipping summary preview */}
                  {selectedAddress && (
                    <div className="p-4 rounded-sm border border-dashed bg-zinc-50/30 dark:bg-zinc-900/5 flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">Shipping to: </span>
                        <span>
                          {selectedAddress.name} ({selectedAddress.phone}) — {selectedAddress.area},{" "}
                          {selectedAddress.city}, {selectedAddress.district} - {selectedAddress.postalCode}
                        </span>
                        <button
                          onClick={() => setActiveTab("shipping")}
                          className="text-primary hover:underline ml-2 font-semibold"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Payment option list */}
                  <div className="space-y-3">
                    {/* COD Option */}
                    <label className="border border-primary rounded-sm p-4 flex items-center justify-between cursor-pointer bg-primary/[0.01]">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          defaultChecked
                          className="h-4 w-4 text-primary focus:ring-ring"
                        />
                        <div>
                          <p className="font-semibold text-sm">Cash on Delivery (COD)</p>
                          <p className="text-xs text-muted-foreground">Pay in cash when courier delivers to your door</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                        Recommended
                      </span>
                    </label>

                    {/* bKash (disabled) */}
                    <label className="border border-border/60 rounded-sm p-4 flex items-center justify-between opacity-50 cursor-not-allowed bg-zinc-50/20 dark:bg-zinc-900/10">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bkash"
                          disabled
                          className="h-4 w-4 text-muted-foreground focus:ring-ring cursor-not-allowed"
                        />
                        <div>
                          <p className="font-semibold text-sm text-zinc-500 dark:text-zinc-400">bKash Payment</p>
                          <p className="text-xs text-muted-foreground">Direct secure payment via bKash wallet</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ml-4">
                        Coming soon
                      </span>
                    </label>

                    {/* Nagad (disabled) */}
                    <label className="border border-border/60 rounded-sm p-4 flex items-center justify-between opacity-50 cursor-not-allowed bg-zinc-50/20 dark:bg-zinc-900/10">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="nagad"
                          disabled
                          className="h-4 w-4 text-muted-foreground focus:ring-ring cursor-not-allowed"
                        />
                        <div>
                          <p className="font-semibold text-sm text-zinc-500 dark:text-zinc-400">Nagad Payment</p>
                          <p className="text-xs text-muted-foreground">Direct secure payment via Nagad wallet</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ml-4">
                        Coming soon
                      </span>
                    </label>

                    {/* Credit / Debit Card (disabled) */}
                    <label className="border border-border/60 rounded-sm p-4 flex items-center justify-between opacity-50 cursor-not-allowed bg-zinc-50/20 dark:bg-zinc-900/10">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          disabled
                          className="h-4 w-4 text-muted-foreground focus:ring-ring cursor-not-allowed"
                        />
                        <div>
                          <p className="font-semibold text-sm text-zinc-500 dark:text-zinc-400">Visa / Mastercard</p>
                          <p className="text-xs text-muted-foreground">Pay with local or international bank cards</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ml-4">
                        Coming soon
                      </span>
                    </label>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/10 border-t p-6 rounded-b-xl">
                  <Button variant="outline" onClick={() => setActiveTab("shipping")} disabled={isPlacingOrder}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Back to Shipping
                  </Button>
                  <Button onClick={handlePlaceOrder} disabled={isPlacingOrder || !selectedAddress} className="min-w-[150px]">
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing Order...
                      </>
                    ) : (
                      "Place Order (COD)"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-md border-border/60 overflow-hidden sticky top-8 bg-zinc-50/40 dark:bg-zinc-900/20">
            <CardHeader className="border-b bg-background/50">
              <CardTitle className="text-base font-bold">Order Summary</CardTitle>
              <CardDescription>Totals are recomputed securely on validation</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4 bg-background/20">
              {/* Mini Item List */}
              <div className="max-h-[220px] overflow-y-auto pr-2 space-y-3 divide-y divide-border/40 scrollbar-thin">
                {items.map((item, idx) => (
                  <div key={item.variantSku} className="flex justify-between items-center text-xs pt-3 first:pt-0">
                    <div className="flex items-center space-x-2 min-w-0 pr-4">
                      <div className="relative h-10 w-8 rounded bg-muted overflow-hidden shrink-0 border">
                        <ProductImage
                          src={item.imagePublicId}
                          alt={item.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.color} | {item.size} × {item.qty}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{formatBDT(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon section */}
              <div className="border-t pt-4 space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Have a coupon?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    placeholder="Enter code"
                    className="flex-1 min-w-0 h-9 rounded-sm border border-border/60 bg-background px-3 text-sm uppercase tracking-wider focus:outline-none focus:border-primary transition-colors"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleApplyCoupon}
                    className="shrink-0"
                  >
                    Apply
                  </Button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-red-500 font-medium">{couponError}</p>
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatBDT(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Shipping Fee</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {totals.shipping === 0 ? "FREE" : formatBDT(totals.shipping)}
                  </span>
                </div>
                {totals.subtotal > 0 && totals.subtotal <= FREE_SHIPPING_THRESHOLD && (
                  <p className="text-[10px] text-primary bg-primary/5 rounded px-2 py-1 font-medium border border-primary/10">
                    💡 Add items worth {formatBDT(FREE_SHIPPING_THRESHOLD - totals.subtotal)} more to get free shipping!
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Shipping is charged per store and finalized on the server when you place the order.
                </p>
                <div className="border-t pt-4 flex justify-between items-end">
                  <span className="font-bold text-sm">Estimated Total</span>
                  <span className="font-extrabold text-lg text-primary">{formatBDT(totals.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-border/60 px-4 py-3 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex items-center gap-4">
        <div className="shrink-0">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide leading-none">
            {activeTab === "payment" ? "Total" : "Est. Total"}
          </p>
          <p className="text-lg font-extrabold text-primary leading-tight">{formatBDT(totals.total)}</p>
        </div>
        <Button
          onClick={advanceOrPlaceOrder}
          disabled={isPlacingOrder || (activeTab === "payment" && !selectedAddress)}
          className="flex-1 h-12 text-sm font-bold"
        >
          {isPlacingOrder ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing Order...
            </>
          ) : (
            <>
              {mobileCtaLabel}
              {activeTab !== "payment" && <ChevronRight className="h-4 w-4 ml-1" />}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

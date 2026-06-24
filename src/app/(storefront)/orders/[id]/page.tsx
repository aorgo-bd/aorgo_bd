"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Order } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProductImage } from "@/components/ProductImage";
import { useUser } from "@/lib/hooks/useUser";

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200/50";
    case "confirmed":
      return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200/50";
    case "processing":
      return "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-200/50";
    case "shipped":
      return "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200/50";
    case "delivered":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200/50";
    case "returned":
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200/50";
    case "cancelled":
      return "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200/50";
    default:
      return "bg-zinc-50 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-350 border-zinc-200/50";
  }
}
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Truck, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  params: {
    id: string;
  };
}

// Map order statuses to step-indexes for a simplified visual tracker
const ORDER_STEPS = [
  { status: "pending", label: "Placed", desc: "Waiting for seller confirmation" },
  { status: "confirmed", label: "Confirmed", desc: "Seller approved the order" },
  { status: "processing", label: "Processing", desc: "Items are being packaged" },
  { status: "shipped", label: "Shipped", desc: "Courier has picked up package" },
  { status: "delivered", label: "Delivered", desc: "Package handed to customer" }
];

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = params;
  const { user, isAuthenticated, isLoading: isLoadingUser } = useUser();

  // Query order doc client-side
  const {
    data: order,
    isLoading: isLoadingQuery,
    error,
  } = useQuery<Order | null>({
    queryKey: ["order", id],
    queryFn: async () => {
      if (!id) return null;
      const docRef = doc(db, "orders", id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return null;
      }
      return { id: snap.id, ...snap.data() } as Order;
    },
    enabled: !!id && isAuthenticated,
  });

  const isLoading = isLoadingUser || isLoadingQuery;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading order details...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-lg mx-auto py-16 px-4">
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold">Access Order Details</CardTitle>
            <CardDescription>Authentication Required</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-6 space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-center text-sm">
              Please sign in to access details for this order.
            </p>
          </CardContent>
          <div className="p-6 pt-0 flex flex-col space-y-2">
            <Link
              href={`/login?redirect=/orders/${id}`}
              className={cn(buttonVariants({ variant: "default" }), "w-full text-center py-2")}
            >
              Log In
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4 text-center space-y-6">
        <div className="h-20 w-20 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Order not found</h2>
          <p className="text-muted-foreground text-sm">
            This order does not exist or you do not have permission to view it.
          </p>
        </div>
        <Link
          href="/orders"
          className={cn(buttonVariants({ variant: "default" }), "py-2 px-4 inline-block")}
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate standard step active indicators
  const currentStatusIdx = ORDER_STEPS.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === "cancelled";
  const isReturned = order.status === "returned";

  return (
    <div className="container mx-auto max-w-6xl py-10 px-4 md:px-6">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/orders"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "pl-0 hover:bg-transparent flex items-center text-muted-foreground hover:text-foreground py-1.5")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Link>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 border-b pb-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Order #{order.id}</h1>
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold border capitalize tracking-wide shadow-sm flex items-center gap-1.5",
                getStatusBadgeClass(order.status)
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0 animate-pulse" />
              {order.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Placed on {formattedDate}</span>
            <span className="hidden sm:inline">•</span>
            <span>Sold by <strong className="text-zinc-700 dark:text-zinc-300">{order.storeName}</strong></span>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-fit" onClick={() => window.print()}>
          <FileText className="h-4 w-4 mr-2" /> Print Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Order progress timeline & purchased items list */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Visual Step Tracker (Only shown if not cancelled/returned) */}
          {!isCancelled && !isReturned ? (
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">Order Tracking</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Horizontal flow line for desktops */}
                <div className="hidden md:flex justify-between items-center relative w-full mb-8 pt-4">
                  {/* Background progress bar */}
                  <div className="absolute left-[8%] right-[8%] top-[calc(1rem+8px)] h-0.5 bg-zinc-200 dark:bg-zinc-800 z-0">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${(Math.max(0, currentStatusIdx) / (ORDER_STEPS.length - 1)) * 100}%` }}
                    />
                  </div>

                  {ORDER_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStatusIdx;
                    const isActive = idx === currentStatusIdx;
                    return (
                      <div key={step.status} className="flex flex-col items-center text-center relative z-10 w-[18%]">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all shadow",
                            isCompleted 
                              ? "bg-primary border-primary text-primary-foreground font-bold" 
                              : "bg-background border-zinc-200 dark:border-zinc-800 text-muted-foreground",
                            isActive && "ring-4 ring-primary/20 scale-110"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 stroke-[3]" />
                          ) : (
                            <span className="text-xs">{idx + 1}</span>
                          )}
                        </div>
                        <p className={cn("text-xs font-bold mt-2 truncate w-full", isCompleted ? "text-foreground" : "text-muted-foreground")}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Vertical detailed logs list */}
                <div className="space-y-6 relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 pl-6 py-2">
                  {order.statusHistory?.map((log: any, idx: number) => {
                    const logDate = new Date(log.at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-extrabold capitalize text-foreground px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-md border border-border/50">
                              {log.status}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{logDate}</span>
                          </div>
                          {log.note && (
                            <p className="text-xs text-muted-foreground/80 mt-1 pl-1">
                              {log.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Return or Cancelled Alert */
            <Card className={cn("border shadow-sm", isCancelled ? "bg-rose-50/10 border-rose-200/50" : "bg-zinc-50/10 border-zinc-200/50")}>
              <CardContent className="p-6 flex items-start space-x-4">
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-inner", isCancelled ? "bg-rose-100 text-rose-700" : "bg-zinc-200 text-zinc-700")}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm capitalize">Order {order.status}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This order was marked as {order.status}. If you believe this is an error or need further clarifications, please contact AORGO Customer Support.
                  </p>
                  <div className="pt-2 text-xs text-muted-foreground/80">
                    {order.statusHistory?.map((log: any, idx: number) => (
                      <div key={idx} className="border-t border-dashed border-border/60 py-1.5 first:border-0">
                        <span className="font-semibold capitalize text-foreground">{log.status}</span> on {new Date(log.at).toLocaleString()}
                        {log.note && <p className="italic mt-0.5">&ldquo;{log.note}&rdquo;</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Purchased Items List */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-bold">Purchased Items</CardTitle>
              <CardDescription>Product breakdowns and invoice rates</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/60 p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/10 text-muted-foreground border-b border-border/40 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4 pl-6">Product Details</th>
                      <th className="p-4 text-center">Attributes</th>
                      <th className="p-4 text-center">Quantity</th>
                      <th className="p-4 text-right pr-6">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {order.items.map((item: any) => (
                      <tr key={item.variantSku} className="hover:bg-zinc-50/10 transition-colors">
                        <td className="p-4 pl-6 flex items-center space-x-3 min-w-[200px]">
                          <div className="relative h-14 w-11 rounded bg-muted border overflow-hidden shrink-0">
                            <ProductImage
                              src={item.imagePublicId}
                              alt={item.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm truncate max-w-[150px] sm:max-w-xs">{item.title}</h4>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{item.variantSku}</p>
                          </div>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                              Size: {item.size}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                              Color: {item.color}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-semibold">{item.qty} × ৳{item.priceAtPurchase}</td>
                        <td className="p-4 text-right pr-6 font-bold text-sm text-zinc-700 dark:text-zinc-300">৳{item.qty * item.priceAtPurchase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Shipping address, Payment, Pricing summary */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Shipping Address */}
          <Card className="shadow-sm border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Delivery Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p className="font-bold text-sm text-foreground">{order.shippingAddress.name}</p>
              <p className="font-medium text-muted-foreground">{order.shippingAddress.phone}</p>
              <p className="text-muted-foreground/80 leading-relaxed">
                {order.shippingAddress.area}, {order.shippingAddress.city}, {order.shippingAddress.district} - {order.shippingAddress.postalCode}
              </p>
            </CardContent>
          </Card>

          {/* Payment & Shipping method details */}
          <Card className="shadow-sm border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>Payment & Shipping</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-bold uppercase bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px]">
                  {order.payment.method}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Status</span>
                <span className={cn(
                  "font-bold uppercase px-2 py-0.5 rounded text-[10px]",
                  order.payment.status === "paid" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
                )}>
                  {order.payment.status}
                </span>
              </div>
              <hr className="border-border/60" />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Delivery Partner</span>
                <span className="font-semibold text-foreground capitalize">
                  {order.shipping.courier || "Pending Assignment"}
                </span>
              </div>
              {order.shipping.trackingId && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tracking ID</span>
                  <span className="font-mono text-foreground font-semibold">
                    {order.shipping.trackingId}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totals Breakdown */}
          <Card className="shadow-sm border-border/50 bg-zinc-50/30 dark:bg-zinc-900/10">
            <CardHeader className="pb-3 border-b bg-background/50">
              <CardTitle className="text-sm font-bold">Billing Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 bg-background/10 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">৳{order.totals.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping Fee</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {order.totals.shipping === 0 ? "FREE" : `৳${order.totals.shipping}`}
                </span>
              </div>
              {order.totals.discount > 0 && (
                <div className="flex justify-between text-primary font-medium">
                  <span>Discount</span>
                  <span>-৳{order.totals.discount}</span>
                </div>
              )}
              <div className="border-t border-border/80 pt-3 flex justify-between items-end">
                <span className="font-bold text-sm text-foreground">Grand Total</span>
                <span className="font-extrabold text-base text-primary">৳{order.totals.total}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

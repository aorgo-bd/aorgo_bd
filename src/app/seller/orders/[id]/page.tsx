"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Order, OrderStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProductImage } from "@/components/ProductImage";
import { useUser } from "@/lib/hooks/useUser";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CreditCard,
  Truck,
  FileText,
  Clock,
  Loader2,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFreshIdToken } from "@/lib/firebase/client-token";

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200/50";
    case "confirmed":
      return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200/50";
    case "processing":
      return "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400 border-pink-200/50";
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

const COURIERS = [
  { value: "manual", label: "Manual / Self Delivery" },
  { value: "steadfast", label: "Steadfast Courier" },
  { value: "pathao", label: "Pathao Courier" },
  { value: "redx", label: "RedX Delivery" },
  { value: "paperfly", label: "Paperfly" },
];

export default function SellerOrderDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<OrderStatus>("pending");
  const [courier, setCourier] = useState<string>("");
  const [trackingId, setTrackingId] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch Order details
  const {
    data: order,
    isLoading,
    error,
  } = useQuery<Order | null>({
    queryKey: ["order-detail", id],
    queryFn: async () => {
      if (!id) return null;
      const snap = await getDoc(doc(db, "orders", id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Order;
    },
    enabled: !!id,
  });

  // Sync inputs with loaded order data
  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setCourier(order.shipping.courier || "");
      setTrackingId(order.shipping.trackingId || "");
    }
  }, [order]);

  const handleUpdateFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setIsUpdating(true);
    try {
      const idToken = await getFreshIdToken();
      const res = await fetch(`/api/seller/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          status,
          courier: courier || null,
          trackingId,
          note,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update order fulfillment details.");
      }

      toast.success("Fulfillment details updated successfully!");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["order-detail", id] });
    } catch (err: any) {
      console.error("Fulfillment update failed:", err);
      toast.error(err.message || "Failed to update order fulfillment details.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading order details...</p>
      </div>
    );
  }

  if (error || !order || (order.storeOwnerUid !== user?.uid && user?.role !== "admin")) {
    return (
      <div className="container max-w-md mx-auto py-16 px-4 text-center space-y-6">
        <div className="h-20 w-20 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Order not found</h2>
          <p className="text-muted-foreground text-sm">
            This order does not exist or you do not have permission to manage it.
          </p>
        </div>
        <Link
          href="/seller/orders"
          className={cn(buttonVariants({ variant: "default" }), "py-2 px-4 inline-block bg-pink-650 hover:bg-pink-700")}
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

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/seller/orders"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "pl-0 hover:bg-transparent flex items-center text-muted-foreground hover:text-foreground py-1.5"
          )}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders List
        </Link>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b pb-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Order #{order.id.slice(-8).toUpperCase()}</h1>
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
          <div className="text-xs text-slate-500 font-mono">
            Full ID: <span className="font-semibold text-slate-700 dark:text-slate-350">{order.id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Placed on {formattedDate}</span>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-fit" onClick={() => window.print()}>
          <FileText className="h-4 w-4 mr-2" /> Print Packing Slip
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Order items & history timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Purchased Items List */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base font-bold">Ordered Products</CardTitle>
              <CardDescription>Product details and pricing breakdowns</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/60 p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 border-b border-border/40 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4 pl-6">Product Details</th>
                      <th className="p-4 text-center">Attributes</th>
                      <th className="p-4 text-center">Quantity</th>
                      <th className="p-4 text-right pr-6">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {order.items.map((item: any) => (
                      <tr key={item.variantSku} className="hover:bg-zinc-50/10 dark:hover:bg-zinc-900/10 transition-colors">
                        <td className="p-4 pl-6 flex items-center space-x-3 min-w-[200px]">
                          <div className="relative h-14 w-11 rounded border overflow-hidden shrink-0 bg-slate-50">
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
                            <span className="px-1.5 py-0.5 rounded bg-zinc-150 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                              Size: {item.size || "N/A"}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-zinc-150 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                              Color: {item.color || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-semibold">{item.qty} × ৳{item.priceAtPurchase}</td>
                        <td className="p-4 text-right pr-6 font-bold text-sm text-zinc-700 dark:text-zinc-300">৳{(item.qty * item.priceAtPurchase).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Logs */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-pink-500" />
                <span>Order History Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
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
                      <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-pink-600 bg-background flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-pink-650" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-extrabold capitalize text-foreground px-2 py-0.5 bg-zinc-150 dark:bg-zinc-800/80 rounded-md border border-border/50">
                            {log.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{logDate}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            by {log.by}
                          </span>
                        </div>
                        {log.note && (
                          <p className="text-xs text-slate-500 mt-1 pl-1">
                            &ldquo;{log.note}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Fulfillment Actions, Address, Billing */}
        <div className="lg:col-span-4 space-y-6">
          {/* Fulfillment Actions Card */}
          <Card className="shadow-sm border-pink-100 bg-pink-50/10 dark:border-pink-900/30 dark:bg-pink-950/10">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center space-x-2">
                <Truck className="h-4.5 w-4.5 text-pink-500" />
                <span>Process Fulfillment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateFulfillment} className="space-y-4">
                {/* Order Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Order Status *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OrderStatus)}
                    className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring"
                  >
                    <option value="pending">Pending Confirmation</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="returned">Returned</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Courier Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Courier Partner
                  </label>
                  <select
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring"
                  >
                    <option value="">Unassigned</option>
                    {COURIERS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tracking ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Tracking Reference ID
                  </label>
                  <input
                    type="text"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="Enter dispatch reference number..."
                    className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm placeholder:text-muted-foreground outline-none focus-visible:border-ring"
                  />
                </div>

                {/* Optional Status Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Update Log Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Package dispatched via Pathao Courier at 2:00 PM."
                    className="flex w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm placeholder:text-muted-foreground outline-none resize-none focus-visible:border-ring"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs uppercase rounded-xl py-2 shadow-md flex items-center justify-center gap-1.5"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Save Fulfillment Details</span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>Delivery Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p className="font-bold text-sm text-foreground">{order.shippingAddress.name}</p>
              <p className="font-medium text-slate-500">{order.shippingAddress.phone}</p>
              <p className="text-slate-400 leading-relaxed font-medium">
                {order.shippingAddress.area}, {order.shippingAddress.city}, {order.shippingAddress.district} - {order.shippingAddress.postalCode}
              </p>
            </CardContent>
          </Card>

          {/* Billing breakdown */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold">Billing Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-slate-700 dark:text-slate-350">৳{order.totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Shipping Fee</span>
                <span className="text-slate-700 dark:text-slate-350">৳{order.totals.shipping.toLocaleString()}</span>
              </div>
              {order.totals.discount > 0 && (
                <div className="flex justify-between font-medium text-pink-600">
                  <span>Discount</span>
                  <span>-৳{order.totals.discount.toLocaleString()}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between items-end">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-250">Grand Total</span>
                <span className="font-extrabold text-base text-pink-600">৳{order.totals.total.toLocaleString()}</span>
              </div>
              <hr />
              <div className="flex justify-between items-center text-[10px] pt-1">
                <span className="text-slate-400 uppercase font-semibold">Payment Mode:</span>
                <span className="font-bold uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                  {order.payment.method}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 uppercase font-semibold">Payment Status:</span>
                <span className={cn(
                  "font-bold uppercase px-2 py-0.5 rounded",
                  order.payment.status === "paid" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                )}>
                  {order.payment.status}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

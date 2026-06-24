"use client";

import React from "react";
import { useUser } from "@/lib/hooks/useUser";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Store, Order } from "@/lib/types";
import {
  Currency,
  ShoppingBag,
  TrendingUp,
  Star,
  Clock,
  CheckCircle,
  Truck,
  ArrowRight,
  Package,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SellerDashboard() {
  const { user } = useUser();

  // Fetch Store Info
  const { data: store, isLoading: isStoreLoading } = useQuery<Store | null>({
    queryKey: ["store", user?.storeId],
    queryFn: async () => {
      if (!user?.storeId) return null;
      const snap = await getDoc(doc(db, "stores", user.storeId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Store;
    },
    enabled: !!user?.storeId,
  });

  // Fetch Seller Orders
  const { data: orders, isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: ["seller-orders", user?.storeId],
    queryFn: async () => {
      if (!user?.storeId) return [];
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef,
        where("storeId", "==", user.storeId)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      
      // Sort client-side by newest first
      return list.sort((a, b) => b.createdAt - a.createdAt);
    },
    enabled: !!user?.storeId,
  });

  const isLoading = isStoreLoading || isOrdersLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold">Store Not Found</h2>
        <p className="text-slate-500">Please complete registration or contact support.</p>
      </div>
    );
  }

  // Calculate order statuses
  const pendingOrders = orders?.filter((o: Order) => o.status === "pending" || o.status === "processing") || [];
  const completedOrders = orders?.filter((o: Order) => o.status === "delivered") || [];
  
  // Format price helper
  const formatBDT = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const kpis = [
    {
      title: "Total Revenue",
      value: formatBDT(store.totalSales || 0),
      description: "Net earnings before commission",
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50",
    },
    {
      title: "Total Orders",
      value: orders?.length || 0,
      description: "Lifetime store orders placed",
      icon: ShoppingBag,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50",
    },
    {
      title: "Total Products",
      value: store.totalProducts || 0,
      description: "Active & pending listings",
      icon: Package,
      color: "text-violet-500 bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/50",
    },
    {
      title: "Average Rating",
      value: store.rating ? `${store.rating.toFixed(1)} / 5.0` : "No Ratings",
      description: `${store.reviewCount || 0} reviews received`,
      icon: Star,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-slate-100 p-8 shadow-xl dark:bg-slate-950">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-400 border border-indigo-500/20">
              Store Status: {store.status}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-3">
              Hello, {store.name}!
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-lg">
              Manage your products, process customer orders, and track your business growth on AORGO.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/seller/products/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/10">
                Create Listing
              </Button>
            </Link>
            <Link href="/seller/products">
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                View Inventory
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="overflow-hidden border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {kpi.title}
                    </p>
                    <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                      {kpi.value}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {kpi.description}
                    </p>
                  </div>
                  <div className={`rounded-2xl border p-3 ${kpi.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders Table / Card Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders List */}
        <Card className="lg:col-span-2 border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" /> Recent Orders
            </CardTitle>
            <Link href="/seller/orders" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 dark:text-indigo-400">
              All Orders <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {orders && orders.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                 {orders.slice(0, 5).map((order: Order) => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                          #{order.id.slice(-8).toUpperCase()}
                        </span>
                        <Badge
                          className={cn(
                            "text-[10px] px-2 py-0.5",
                            order.status === "delivered"
                              ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                              : order.status === "cancelled"
                              ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                          )}
                          variant="secondary"
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        Placed by {order.customerName} &bull; {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-right sm:text-right">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {formatBDT(order.totals.subtotal)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {order.items.reduce((s: number, i: any) => s + i.qty, 0)} Items
                        </p>
                      </div>
                      <Link href={`/seller/orders`}>
                        <Button size="sm" variant="ghost" className="h-8 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                          View details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <ShoppingBag className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-800 mb-3" />
                <p className="text-sm">No orders received yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Store Performance / Operations */}
        <div className="space-y-6">
          <Card className="border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" /> Fulfilment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-medium text-slate-500">Pending Actions</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {pendingOrders.length} orders
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-medium text-slate-500">Completed Payouts</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {completedOrders.length} orders
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Commission Rate</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {Math.round(store.commissionRate * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-500" /> Shipping Partners
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500 leading-relaxed">
              Customer orders are shipped from your warehouse. Ensure to package items and hand them over to AORGO logistics partner. Deliveries are processed nationwide within Bangladesh.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

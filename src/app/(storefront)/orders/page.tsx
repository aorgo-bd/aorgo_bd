"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useUser } from "@/lib/hooks/useUser";
import { Order } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProductImage } from "@/components/ProductImage";
import { ShoppingBag, ChevronRight, Calendar, Landmark, Truck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Status Badge Styling Helper
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

export default function CustomerOrdersPage() {
  const { user, isAuthenticated, isLoading: isLoadingUser } = useUser();

  const {
    data: orders = [],
    isLoading: isLoadingQuery,
    error,
  } = useQuery<Order[]>({
    queryKey: ["orders", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("customerUid", "==", user.uid));
      const snapshot = await getDocs(q);

      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      // Sort by newest orders in-memory to prevent complex composite index compilations
      fetched.sort((a, b) => b.createdAt - a.createdAt);
      return fetched;
    },
    enabled: !!user?.uid,
  });

  const isLoading = isLoadingUser || isLoadingQuery;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading orders...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-lg mx-auto py-16 px-4">
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold">Access Orders</CardTitle>
            <CardDescription>You need to be logged in to view your order history</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-6 space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-center text-sm">
              Please sign in to view and track your purchases.
            </p>
          </CardContent>
          <div className="p-6 pt-0 flex flex-col space-y-2">
            <Link
              href={`/login?redirect=/orders`}
              className={cn(buttonVariants({ variant: "default" }), "w-full text-center py-2")}
            >
              Log In
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-10 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Your Orders</h1>
        <p className="text-muted-foreground text-sm">Track and manage your order history</p>
      </div>

      {error ? (
        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 mb-6">
          Failed to load orders. Please refresh the page or try again.
        </div>
      ) : null}

      {orders.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl bg-zinc-50/20 dark:bg-zinc-900/10 space-y-6">
          <div className="h-16 w-16 mx-auto rounded-full bg-primary/5 flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">No orders found</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              You haven&apos;t placed any orders yet. Check out our latest products!
            </p>
          </div>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "default" }), "py-2 px-4 inline-block")}
          >
            Browse Store
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: Order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            const totalItemsCount = order.items.reduce((sum, item: any) => sum + item.qty, 0);

            return (
              <Card
                key={order.id}
                className="overflow-hidden hover:border-zinc-350 dark:hover:border-zinc-700 transition-all border-border/60"
              >
                <div className="border-b bg-zinc-50/50 dark:bg-zinc-800/10 px-6 py-4 flex flex-wrap justify-between items-center gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <p className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider mb-0.5">
                        Order Placed
                      </p>
                      <div className="flex items-center space-x-1 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider mb-0.5">
                        Order ID
                      </p>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
                        {order.id}
                      </span>
                    </div>

                    <div>
                      <p className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider mb-0.5">
                        Payment Mode
                      </p>
                      <div className="flex items-center space-x-1 font-medium">
                        <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="uppercase">{order.payment.method}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider mb-0.5">
                      Total Cost
                    </p>
                    <span className="font-bold text-sm text-primary">
                      ৳{order.totals.total}
                    </span>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Items display */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex -space-x-3 overflow-hidden">
                          {order.items.slice(0, 3).map((item: any) => (
                            <div
                              key={item.variantSku}
                              className="relative h-12 w-10 rounded border-2 border-background overflow-hidden bg-zinc-100 shrink-0 shadow-sm"
                            >
                              <ProductImage
                                src={item.imagePublicId}
                                alt={item.title}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="h-12 w-10 rounded border-2 border-background bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold flex items-center justify-center shadow-sm">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate max-w-md">
                            {order.items[0]?.title}
                            {order.items.length > 1 ? ` & ${order.items.length - 1} other item(s)` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {totalItemsCount} item{totalItemsCount > 1 ? "s" : ""} from{" "}
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                              {order.storeName}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status & View CTA */}
                    <div className="flex items-center md:justify-end space-x-4 shrink-0">
                      <div className="flex flex-col items-start md:items-end">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-bold border capitalize tracking-wide shadow-sm flex items-center gap-1.5",
                            getStatusBadgeClass(order.status)
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0 animate-pulse" />
                          {order.status}
                        </span>
                      </div>
                      <Link
                        href={`/orders/${order.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex items-center py-1 px-3")}
                      >
                        Details <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

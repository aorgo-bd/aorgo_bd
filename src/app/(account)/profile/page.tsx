"use client";

import { useUser } from "@/lib/hooks/useUser";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import Link from "next/link";
import { Package, Heart, Star, ChevronRight, ShoppingBag } from "lucide-react";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { Badge } from "@/components/ui/badge";

export default function ProfileOverviewPage() {
  const { user } = useUser();
  const wishlistIds = useWishlistStore((s) => s.ids);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders-summary", user?.uid],
    enabled: !!user?.uid,
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(
        collection(db, "orders"),
        where("customerUid", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black">
            Welcome back, {user?.displayName?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Manage your purchases, delivery addresses, and account credentials.
          </p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Package}
          label="Total Orders"
          value={orders.length}
          href="/profile/orders"
          color="text-blue-600 bg-blue-50 border-blue-100"
        />
        <StatCard
          icon={Heart}
          label="My Wishlist"
          value={wishlistIds.length}
          href="/wishlist"
          color="text-red-600 bg-red-50 border-red-100"
        />
        <StatCard
          icon={Star}
          label="Reviews Written"
          value={0} // Stuffed/placeholder for reviews
          href="/profile"
          color="text-amber-600 bg-amber-50 border-amber-100"
        />
      </div>

      {/* Recent Orders Section */}
      <section className="border border-gray-150 rounded-2xl overflow-hidden bg-white">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-black flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gray-500" />
            <span>Recent Orders</span>
          </h2>
          {orders.length > 0 && (
            <Link
              href="/profile/orders"
              className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-0.5 uppercase tracking-wider"
            >
              <span>View all</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-550 mb-4">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center bg-black hover:bg-black/90 text-white font-bold rounded-full px-6 text-xs uppercase tracking-wide transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order: any) => (
              <div
                key={order.id}
                className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-black">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <Badge
                      className={`text-[9px] uppercase font-extrabold tracking-wide px-2 py-0.5 border ${
                        order.status === "delivered"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : order.status === "cancelled"
                          ? "bg-red-50 text-red-700 border-red-100"
                          : "bg-pink-50 text-pink-700 border-pink-100"
                      }`}
                      variant="secondary"
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 font-semibold">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""} • Total: ৳{order.totals.total}
                  </p>
                </div>
                <Link
                  href={`/orders/${order.id}`}
                  className="inline-flex h-9 items-center justify-center border border-gray-200 hover:border-black rounded-lg px-4 text-xs font-bold text-gray-700 hover:text-black transition-colors w-fit bg-white"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<any>;
  label: string;
  value: number;
  href: string;
  color: string;
}

function StatCard({ icon: Icon, label, value, href, color }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group block p-5 rounded-2xl border border-gray-150 bg-white hover:border-black transition-all hover:shadow-xs"
    >
      <div className={`p-2 rounded-xl border w-fit ${color} transition-transform group-hover:scale-105 duration-200`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-black text-black mt-4 tracking-tight">{value}</p>
      <p className="text-sm font-semibold text-gray-400 mt-0.5">{label}</p>
    </Link>
  );
}

"use client";

import { useUser } from "@/lib/hooks/useUser";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import Link from "next/link";
import { Package, Calendar, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MyOrdersPage() {
  const { user } = useUser();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders-all", user?.uid],
    enabled: !!user?.uid,
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(
        collection(db, "orders"),
        where("customerUid", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
        <Link href="/profile" className="text-gray-400 hover:text-black lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-black">My Orders</h1>
          <p className="text-xs text-gray-500 font-medium">Track shipping status and review past purchases</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Loading your order history...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-sm font-semibold text-gray-700">No orders placed yet</p>
          <p className="text-xs text-gray-450 mt-1 mb-6">Discover the latest products on AORGO and place your first order!</p>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center bg-black hover:bg-black/90 text-white font-bold rounded-full px-6 text-xs uppercase tracking-wide transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div
              key={order.id}
              className="border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-3xs"
            >
              {/* Top Row: Info */}
              <div className="bg-gray-50/50 px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div>
                    <span className="text-gray-400 font-semibold uppercase tracking-wide">Order ID:</span>{" "}
                    <span className="font-bold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge
                  className={`text-[9px] uppercase font-extrabold tracking-wide px-2.5 py-0.5 border w-fit ${
                    order.status === "delivered"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : order.status === "cancelled"
                      ? "bg-red-50 text-red-700 border-red-100"
                      : "bg-indigo-50 text-indigo-700 border-indigo-100"
                  }`}
                  variant="secondary"
                >
                  {order.status}
                </Badge>
              </div>

              {/* Items Summary */}
              <div className="p-5 divide-y divide-gray-100">
                {order.items.map((item: any) => (
                  <div key={item.variantSku} className="py-3.5 first:pt-0 last:pb-0 flex gap-4">
                    <div className="w-12 h-15 bg-gray-100 rounded-md overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center text-xs text-gray-400">
                      {/* Note: since Cloudinary rendering logic exists, for simplicity we show a placeholder or use standard img */}
                      {item.imagePublicId ? (
                        <img
                          src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_thumb,w_80,h_100,g_face/f_auto,q_auto/${item.imagePublicId}`}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).style.display = "none";
                          }}
                        />
                      ) : (
                        <Package className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Size: <span className="font-semibold text-gray-700">{item.size || "Free"}</span> • Color: <span className="font-semibold text-gray-700">{item.color || "Default"}</span> • Qty: <span className="font-semibold text-gray-700">{item.qty}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-black">৳{item.priceAtPurchase * item.qty}</p>
                      <p className="text-[10px] text-gray-450 mt-0.5">৳{item.priceAtPurchase} each</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom row: Total and Actions */}
              <div className="px-5 py-4 bg-gray-50/20 border-t border-gray-100 flex items-center justify-between gap-4">
                <p className="text-xs font-semibold text-gray-500">
                  Total Amount: <span className="text-sm font-black text-black ml-1">৳{order.totals.total}</span>
                </p>
                <Link
                  href={`/orders/${order.id}`}
                  className="inline-flex h-9 items-center justify-center bg-black hover:bg-black/90 text-white rounded-lg px-4 text-xs font-bold transition-colors"
                >
                  Track Order
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

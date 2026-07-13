"use client";

import React, { useMemo } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { useQuery } from "@tanstack/react-query";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Order, OrderItem, Store, OrderStatus } from "@/lib/types";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  ShoppingBag,
  Coins,
  Wallet,
  BarChart3,
  Trophy,
  Loader2,
} from "lucide-react";

const REVENUE_STATUSES: OrderStatus[] = ["confirmed", "processing", "shipped", "delivered"];
const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#6366f1",
  processing: "#8b5cf6",
  shipped: "#0ea5e9",
  delivered: "#10b981",
  returned: "#f97316",
  cancelled: "#ef4444",
};

const formatBDT = (amount: number) =>
  `৳${Math.round(amount).toLocaleString("en-US")}`;

export default function SellerAnalyticsPage() {
  const { user } = useUser();
  const storeId = user?.storeId;

  const { data: store } = useQuery<Store | null>({
    queryKey: ["store", storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const snap = await getDoc(doc(db, "stores", storeId));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as Store) : null;
    },
    enabled: !!storeId,
  });

  const ownerUid = user?.uid;
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["seller-orders-analytics", ownerUid],
    queryFn: async () => {
      if (!ownerUid) return [];
      // Match firestore.rules: seller order reads are authorized by
      // storeOwnerUid, so the list query must filter on that field.
      const q = query(
        collection(db, "orders"),
        where("storeOwnerUid", "==", ownerUid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[];
    },
    enabled: !!ownerUid,
  });

  const analytics = useMemo(() => {
    const revenueOrders = orders.filter((o: Order) => REVENUE_STATUSES.includes(o.status));
    const grossRevenue = revenueOrders.reduce((s: number, o: Order) => s + (o.totals?.subtotal || 0), 0);
    const unitsSold = revenueOrders.reduce(
      (s: number, o: Order) => s + (o.items || []).reduce((n: number, i: OrderItem) => n + i.qty, 0),
      0
    );
    const aov = revenueOrders.length ? grossRevenue / revenueOrders.length : 0;
    const commissionRate = store?.commissionRate ?? 0;
    const commissionOwed = grossRevenue * commissionRate;
    const netPayout = grossRevenue - commissionOwed;

    // 30-day revenue trend.
    const now = new Date();
    const trend: { date: string; Revenue: number; Orders: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const start = d.getTime();
      const end = start + 86400000;
      const dayOrders = revenueOrders.filter((o: Order) => o.createdAt >= start && o.createdAt < end);
      trend.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        Revenue: dayOrders.reduce((s: number, o: Order) => s + (o.totals?.subtotal || 0), 0),
        Orders: dayOrders.length,
      });
    }

    // Status breakdown.
    const statusMap = new Map<string, number>();
    orders.forEach((o: Order) => statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1));
    const statusData = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

    // Top products by units sold (across revenue orders).
    const productMap = new Map<string, { title: string; qty: number; revenue: number }>();
    revenueOrders.forEach((o: Order) => {
      (o.items || []).forEach((i: OrderItem) => {
        const cur = productMap.get(i.productId) || { title: i.title, qty: 0, revenue: 0 };
        cur.qty += i.qty;
        cur.revenue += i.qty * i.priceAtPurchase;
        productMap.set(i.productId, cur);
      });
    });
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    return {
      grossRevenue,
      unitsSold,
      aov,
      commissionOwed,
      netPayout,
      commissionRate,
      totalOrders: orders.length,
      trend,
      statusData,
      topProducts,
    };
  }, [orders, store]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
        <p className="text-sm text-slate-500">Crunching your sales numbers...</p>
      </div>
    );
  }

  const kpis = [
    { label: "Gross Revenue", value: formatBDT(analytics.grossRevenue), hint: "Confirmed → delivered", icon: TrendingUp, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
    { label: "Net Payout", value: formatBDT(analytics.netPayout), hint: `After ${Math.round(analytics.commissionRate * 100)}% commission`, icon: Wallet, color: "text-pink-500 bg-pink-50 dark:bg-pink-950/20" },
    { label: "Commission Owed", value: formatBDT(analytics.commissionOwed), hint: "Platform fee", icon: Coins, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
    { label: "Units Sold", value: analytics.unitsSold.toLocaleString(), hint: `${analytics.totalOrders} total orders`, icon: ShoppingBag, color: "text-pink-500 bg-pink-50 dark:bg-pink-950/20" },
    { label: "Avg Order Value", value: formatBDT(analytics.aov), hint: "Per revenue order", icon: BarChart3, color: "text-sky-500 bg-sky-50 dark:bg-sky-950/20" },
  ];

  const hasData = analytics.totalOrders > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-pink-500" /> Analytics & Reports
        </h1>
        <p className="text-sm text-slate-500">
          Sales performance, payout breakdown, and your best-selling products.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`rounded-xl p-2.5 ${k.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-3">{k.label}</p>
                <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{k.value}</p>
                <p className="text-[10px] text-slate-400">{k.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!hasData ? (
        <div className="text-center py-20 text-slate-400 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 text-slate-300 dark:text-slate-800" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No sales data yet</p>
          <p className="text-xs">Your analytics will appear here once orders start coming in.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue trend */}
            <Card className="lg:col-span-2 border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-pink-500" /> Revenue — Last 30 Days
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72 pl-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} interval={4} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "none", borderRadius: 12, color: "#fff" }}
                      formatter={(val: number, name: string) => (name === "Revenue" ? formatBDT(val) : val)}
                    />
                    <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#rev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status breakdown */}
            <Card className="border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-pink-500" /> Order Status
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {analytics.statusData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "none", borderRadius: 12, color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 -mt-2">
                  {analytics.statusData.map((s) => (
                    <span key={s.name} className="flex items-center gap-1 text-[10px] font-medium text-slate-500 capitalize">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.name] || "#94a3b8" }} />
                      {s.name} ({s.value})
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top products */}
          <Card className="border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" /> Best-Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topProducts} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="title"
                    tickLine={false}
                    axisLine={false}
                    width={140}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickFormatter={(v: string) => (v.length > 20 ? v.slice(0, 20) + "…" : v)}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "none", borderRadius: 12, color: "#fff" }}
                    formatter={(val: number, name: string) => (name === "revenue" ? formatBDT(val) : val)}
                  />
                  <Bar dataKey="qty" name="Units" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

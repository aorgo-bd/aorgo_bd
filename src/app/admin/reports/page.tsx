"use client";

import React, { useMemo } from "react";
import { useAdminOrders, useAdminProducts } from "@/lib/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order, Product, OrderItem } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, PieChart as PieIcon, ShieldAlert } from "lucide-react";

export default function AdminReportsPage() {
  const { data: orders = [], isLoading: loadingOrders } = useAdminOrders();
  const { data: products = [], isLoading: loadingProducts } = useAdminProducts();

  const isLoading = loadingOrders || loadingProducts;

  // Create product-to-category lookup map
  const productCategoryMap = useMemo(() => {
    const map: { [id: string]: string } = {};
    products.forEach((p: Product) => {
      map[p.id] = p.category;
    });
    return map;
  }, [products]);

  // 1. Calculate sales performance by category
  const categoryData = useMemo(() => {
    const totals: { [category: string]: number } = {
      "Women's Fashion": 0,
      "Men's Fashion": 0,
      "Footwear": 0,
    };

    orders.forEach((order: Order) => {
      if (order.status !== "cancelled" && order.status !== "returned") {
        order.items?.forEach((item: OrderItem) => {
          const matchedCategorySlug = productCategoryMap[item.productId];
          let readableCategory = "Others";

          if (matchedCategorySlug?.startsWith("women")) {
            readableCategory = "Women's Fashion";
          } else if (matchedCategorySlug?.startsWith("men")) {
            readableCategory = "Men's Fashion";
          } else if (matchedCategorySlug?.startsWith("footwear")) {
            readableCategory = "Footwear";
          }

          const revenue = (item.qty || 1) * (item.priceAtPurchase || 0);
          if (readableCategory in totals) {
            totals[readableCategory] += revenue;
          } else {
            totals[readableCategory] = (totals[readableCategory] || 0) + revenue;
          }
        });
      }
    });

    return Object.keys(totals).map((cat) => ({
      name: cat,
      value: totals[cat],
    }));
  }, [orders, productCategoryMap]);

  // 2. Calculate top sellers leaderboard
  const sellerLeaderboard = useMemo(() => {
    const totals: { [storeName: string]: number } = {};

    orders.forEach((order: Order) => {
      if (order.status !== "cancelled" && order.status !== "returned") {
        const store = order.storeName || "Unknown Partner";
        const total = order.totals?.total || 0;
        totals[store] = (totals[store] || 0) + total;
      }
    });

    const list = Object.keys(totals).map((store) => ({
      store,
      revenue: totals[store],
    }));

    return list
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#3b82f6", "#10b981"];

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">Compiling financial performance indexes...</p>
        </div>
      </div>
    );
  }

  const hasSales = orders.some((o: Order) => o.status !== "cancelled" && o.status !== "returned");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Financial & Performance Reports
        </h1>
        <p className="text-sm text-slate-500">
          Marketplace performance indices including category distribution share and seller leaderboards.
        </p>
      </div>

      {hasSales ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Category Distribution Pie Chart */}
          <Card className="lg:col-span-5 border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <PieIcon className="h-5 w-5 text-violet-500" />
                Category Performance Share
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    outerRadius={75}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`৳${Number(value || 0).toLocaleString()}`, "Sales"]}
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Sellers Bar Chart */}
          <Card className="lg:col-span-7 border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-500" />
                Seller Leaderboard (Top 5 stores)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72 pl-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sellerLeaderboard}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="store"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 650 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
                  />
                  <Tooltip
                    formatter={(value: any) => [`৳${Number(value || 0).toLocaleString()}`, "Revenue"]}
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar
                    dataKey="revenue"
                    name="Gross Sales revenue (৳)"
                    fill="#8b5cf6"
                    radius={[8, 8, 0, 0]}
                  >
                    {sellerLeaderboard.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-20 border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 rounded-2xl">
          <ShieldAlert className="h-12 w-12 mx-auto mb-2 text-slate-300 dark:text-slate-850" />
          <p className="font-semibold text-slate-700 dark:text-slate-350">No sales reports available</p>
          <p className="text-xs text-slate-400">Sales analytical indices will draw as transactions are recorded on the storefront.</p>
        </div>
      )}
    </div>
  );
}

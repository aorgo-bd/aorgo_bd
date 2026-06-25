"use client";

import React, { useMemo } from "react";
import { Order, AuditLog } from "@/lib/types";
import {
  useAdminSellers,
  useAdminProducts,
  useAdminOrders,
  useAdminUsers,
  useAdminAuditLogs,
} from "@/lib/hooks/useAdmin";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FiTrendingUp,
  FiShoppingBag,
  FiShoppingCart,
  FiUsers,
  FiDollarSign,
  FiClock,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  const { data: sellers = [], isLoading: loadingSellers } = useAdminSellers();
  const { data: products = [], isLoading: loadingProducts } = useAdminProducts();
  const { data: orders = [], isLoading: loadingOrders } = useAdminOrders();
  const { data: users = [], isLoading: loadingUsers } = useAdminUsers();
  const { data: auditLogs = [], isLoading: loadingLogs } = useAdminAuditLogs();

  const isDataLoading = loadingSellers || loadingProducts || loadingOrders || loadingUsers || loadingLogs;

  // 1. Calculate KPI Metrics
  const metrics = useMemo(() => {
    const totalSales = orders.reduce((sum: number, order: Order) => {
      // Calculate total sales from non-cancelled and non-returned orders
      if (order.status !== "cancelled" && order.status !== "returned") {
        return sum + (order.totals?.total || 0);
      }
      return sum;
    }, 0);

    const totalOrdersCount = orders.length;
    const totalProductsCount = products.length;
    const totalSellersCount = sellers.length;

    return {
      totalSales,
      totalOrdersCount,
      totalProductsCount,
      totalSellersCount,
    };
  }, [orders, products, sellers]);

  // 2. Prepare 30-day orders trend data
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    // Calculate for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

      const dailyOrders = orders.filter(
        (order: Order) => order.createdAt >= startOfDay && order.createdAt < endOfDay
      );

      const dailyRevenue = dailyOrders.reduce((sum: number, order: Order) => {
        if (order.status !== "cancelled" && order.status !== "returned") {
          return sum + (order.totals?.total || 0);
        }
        return sum;
      }, 0);

      data.push({
        date: dateLabel,
        Orders: dailyOrders.length,
        Revenue: dailyRevenue,
      });
    }
    return data;
  }, [orders]);

  // 3. Get recent audit activities sorted by date desc
  const sortedActivities = useMemo(() => {
    return [...auditLogs]
      .sort((a: AuditLog, b: AuditLog) => b.at - a.at)
      .slice(0, 8);
  }, [auditLogs]);

  if (isDataLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">Assembling admin intelligence...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: `৳${metrics.totalSales.toLocaleString()}`,
      icon: <FiDollarSign className="w-5 h-5" />,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50",
      description: "Sum of non-cancelled sales",
    },
    {
      title: "Total Orders",
      value: metrics.totalOrdersCount.toLocaleString(),
      icon: <FiShoppingCart className="w-5 h-5" />,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50",
      description: "Accumulated volume",
    },
    {
      title: "Registered Sellers",
      value: metrics.totalSellersCount.toLocaleString(),
      icon: <FiTrendingUp className="w-5 h-5" />,
      color: "text-violet-600 bg-violet-50 dark:bg-violet-950/20 dark:text-violet-400 border border-violet-100 dark:border-violet-900/50",
      description: "Active seller partners",
    },
    {
      title: "Active Products",
      value: metrics.totalProductsCount.toLocaleString(),
      icon: <FiShoppingBag className="w-5 h-5" />,
      color: "text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-950/20 dark:text-fuchsia-400 border border-fuchsia-100 dark:border-fuchsia-900/50",
      description: "Approved & pending items",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time oversight of AORGO marketplace operations, seller verifications, and logistics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {card.value}
                </p>
                <p className="text-[10px] font-medium text-slate-400">
                  {card.description}
                </p>
              </div>
              <div className={`p-3.5 rounded-xl ${card.color}`}>
                {card.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sales Area Chart */}
        <Card className="lg:col-span-8 border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FiTrendingUp className="h-5 w-5 text-violet-500" />
              Daily Orders Trend (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80 pl-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#a5b4fc" }}
                  labelStyle={{ color: "#fff", fontWeight: 700 }}
                />
                <Area
                  type="monotone"
                  dataKey="Orders"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity / Audit Log */}
        <Card className="lg:col-span-4 border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FiClock className="h-5 w-5 text-violet-500" />
              Administrative Log
            </CardTitle>
            <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-800 uppercase text-[9px] font-bold px-2 py-0.5">
              Live
            </Badge>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {sortedActivities.length > 0 ? (
              <div className="space-y-4">
                {sortedActivities.map((log) => (
                  <div key={log.id} className="flex gap-3 text-xs leading-5">
                    <div className="relative flex h-6 w-6 flex-none items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-violet-500 ring-4 ring-violet-100 dark:ring-violet-950" />
                    </div>
                    <div className="flex-auto min-w-0">
                      <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {log.action}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Entity: <span className="font-mono text-slate-500">{log.entity}</span> ({log.entityId.slice(-6)})
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        {new Date(log.at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-sm font-medium">
                No recent admin modifications found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

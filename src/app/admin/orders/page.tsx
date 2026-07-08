"use client";

import React, { useState, useMemo } from "react";
import { useAdminOrders } from "@/lib/hooks/useAdmin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Order, OrderStatus } from "@/lib/types";
import { Search, ShoppingCart, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminOrdersPage() {
  const { data: orders = [], isLoading } = useAdminOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const statusColors: { [key in OrderStatus]: string } = {
    pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 border-amber-100",
    confirmed: "bg-blue-50 text-blue-700 dark:bg-blue-950/20 border-blue-100",
    processing: "bg-pink-50 text-pink-700 dark:bg-pink-950/20 border-pink-100",
    shipped: "bg-purple-50 text-purple-700 dark:bg-purple-950/20 border-purple-100",
    delivered: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 border-emerald-100",
    returned: "bg-rose-50 text-rose-700 dark:bg-rose-950/20 border-rose-100",
    cancelled: "bg-slate-50 text-slate-700 dark:bg-slate-950/20 border-slate-100",
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o: Order) => {
        const matchesStatus = statusFilter === "all" || o.status === statusFilter;
        const matchesSearch =
          o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.customerPhone?.includes(searchTerm) ||
          o.storeName?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a: Order, b: Order) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [orders, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Customer Orders
        </h1>
        <p className="text-sm text-slate-500">
          Track transaction IDs, shipping updates, payment capture statuses, and fulfillment logs.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 p-4 rounded-2xl backdrop-blur-md">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order ID, customer name/phone, store..."
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 h-10 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-pink-500 transition-colors"
        >
          <option value="all">All Order Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="returned">Returned</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">Loading marketplace orders...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="font-bold text-xs py-4">Order ID</TableHead>
                <TableHead className="font-bold text-xs">Customer</TableHead>
                <TableHead className="font-bold text-xs">Store</TableHead>
                <TableHead className="font-bold text-xs">Total Items</TableHead>
                <TableHead className="font-bold text-xs">Total Amount</TableHead>
                <TableHead className="font-bold text-xs">Payment</TableHead>
                <TableHead className="font-bold text-xs">Fulfillment status</TableHead>
                <TableHead className="font-bold text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-150 dark:divide-slate-800">
              {filteredOrders.map((order: Order) => {
                const totalQty = order.items?.reduce((sum: number, item) => sum + (item.qty || 0), 0) || 0;

                return (
                  <TableRow key={order.id} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="py-4 font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                      #{order.id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell className="align-top py-4 text-xs space-y-0.5">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{order.customerName}</p>
                      <p className="text-slate-400">{order.customerPhone}</p>
                    </TableCell>
                    <TableCell className="align-top py-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
                      {order.storeName}
                    </TableCell>
                    <TableCell className="align-top py-4 text-xs text-slate-600 dark:text-slate-400">
                      {totalQty} items
                    </TableCell>
                    <TableCell className="align-top py-4 text-xs font-black text-slate-800 dark:text-slate-100">
                      ৳{order.totals?.total?.toLocaleString()}
                    </TableCell>
                    <TableCell className="align-top py-4 text-xs space-y-1">
                      <Badge variant="outline" className="text-[9px] uppercase font-semibold border-slate-200">
                        {order.payment?.method}
                      </Badge>
                      <p className="text-[10px] font-semibold text-slate-400 capitalize">
                        {order.payment?.status}
                      </p>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <Badge
                        className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border ${
                          statusColors[order.status] || "bg-slate-100 text-slate-650"
                        }`}
                        variant="secondary"
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top py-4 text-xs text-slate-450">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <ShoppingCart className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-850" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No orders found</p>
          <p className="text-xs text-slate-400">Try modifying your search queries or filter attributes.</p>
        </div>
      )}
    </div>
  );
}

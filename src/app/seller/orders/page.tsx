"use client";

import React, { useState, useMemo } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Order } from "@/lib/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Eye,
  Calendar,
  User,
  CreditCard,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      return "bg-zinc-150 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200/50";
    case "cancelled":
      return "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200/50";
    default:
      return "bg-zinc-50 text-zinc-750 dark:bg-zinc-850 dark:text-zinc-350 border-zinc-200/50";
  }
}

export default function SellerOrdersPage() {
  const { user } = useUser();

  // Fetch Seller Orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["seller-orders", user?.storeId],
    queryFn: async () => {
      if (!user?.storeId) return [];
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef,
        where("storeId", "==", user.storeId),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
    },
    enabled: !!user?.storeId,
  });

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Filter orders client-side before passing to the table
  const filteredData = useMemo(() => {
    return orders.filter((order: Order) => {
      const nameMatch = order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
      const phoneMatch = order.customerPhone?.includes(searchTerm);
      const idMatch = order.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || phoneMatch || idMatch;

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Define Columns for TanStack Table
  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Order ID",
        cell: ({ row }) => (
          <Link href={`/seller/orders/${row.original.id}`} className="font-mono font-bold text-xs hover:text-indigo-600 hover:underline">
            #{row.original.id.slice(-8).toUpperCase()}
          </Link>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{row.original.customerName}</p>
            <p className="text-[10px] text-slate-400 font-mono">{row.original.customerPhone}</p>
          </div>
        ),
      },
      {
        id: "items",
        header: "Products",
        cell: ({ row }) => {
          const totalItems = row.original.items?.reduce((sum, item) => sum + item.qty, 0) || 0;
          return (
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-450">
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
          );
        },
      },
      {
        id: "total",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-slate-100 dark:hover:bg-slate-900 p-0 font-bold"
          >
            Total BDT <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-bold text-slate-800 dark:text-slate-200">
            ৳{row.original.totals.total.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              className={cn(
                "text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 border shadow-xs",
                getStatusBadgeClass(status)
              )}
              variant="secondary"
            >
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-slate-100 dark:hover:bg-slate-900 p-0 font-bold"
          >
            Date Placed <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          return (
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{date.toLocaleDateString()}</span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <Link href={`/seller/orders/${row.original.id}`}>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-650">
              <Eye className="h-4.5 w-4.5" />
            </Button>
          </Link>
        ),
      },
    ],
    []
  );

  // Initialize TanStack Table
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Orders Management
          </h1>
          <p className="text-sm text-slate-500">
            Track and process client purchase orders, update shipping states, and assign tracking IDs.
          </p>
        </div>
      </div>

      {/* Filtering & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 p-4 rounded-2xl backdrop-blur-md">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Customer Name, Phone, or Order ID..."
            className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 h-10 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
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
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-sm text-slate-500">Loading incoming orders...</p>
          </div>
        ) : filteredData.length > 0 ? (
          <div>
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="font-bold text-slate-500 text-xs py-4">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors border-slate-100 dark:border-slate-800"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-4">
              <span className="text-xs text-slate-500">
                Showing {table.getRowModel().rows.length} of {filteredData.length} orders
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="gap-1 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="gap-1 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500">
            <ShoppingCart className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-800 mb-3" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No orders found</h3>
            <p className="text-sm text-slate-400 mt-1">Try searching another query or wait for customer checkouts.</p>
          </div>
        )}
      </div>
    </div>
  );
}

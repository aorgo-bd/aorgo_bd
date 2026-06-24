"use client";

import React, { useState, useMemo } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { useSellerProducts } from "@/lib/hooks/useProducts";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
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
  Plus,
  Edit2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
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
import { Product } from "@/lib/types";

export default function SellerProductsPage() {
  const { user } = useUser();
  const { data: products, isLoading } = useSellerProducts(user?.uid || "");
  
  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Filter products client-side before passing to the table
  const filteredData = useMemo(() => {
    if (!products) return [];
    return products.filter((p: Product) => {
      const titleMatch = p.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const brandMatch = p.brand?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = titleMatch || brandMatch;
      
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [products, searchTerm, statusFilter]);

  // Define Columns for TanStack Table
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: "image",
        header: "Image",
        cell: ({ row }) => {
          const imageId = row.original.images?.[0];
          return imageId ? (
            <div className="h-12 w-10 overflow-hidden rounded border border-slate-200 dark:border-slate-800 bg-slate-100">
              <ProductImage
                src={imageId}
                alt={row.original.title}
                width={50}
                height={60}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-12 w-10 items-center justify-center rounded border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-[10px] text-slate-400">
              No Img
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-slate-100 dark:hover:bg-slate-900 p-0 font-bold"
          >
            Product <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="max-w-[200px]">
            <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
              {row.original.title}
            </p>
            <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">
              {row.original.brand}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const categorySlug = row.original.category;
          // Format category slug to human readable label
          const label = categorySlug
            ?.replace(/-/g, " ")
            ?.replace(/\b\w/g, (c) => c.toUpperCase());
          return <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>;
        },
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-slate-100 dark:hover:bg-slate-900 p-0 font-bold"
          >
            Price <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const price = row.original.price;
          return <span className="font-bold text-slate-800 dark:text-slate-200">৳{price.toLocaleString()}</span>;
        },
      },
      {
        id: "stock",
        header: "Stock",
        cell: ({ row }) => {
          const totalStock = row.original.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
          return (
            <span
              className={cn(
                "text-xs font-semibold",
                totalStock === 0
                  ? "text-red-500"
                  : totalStock < 10
                  ? "text-amber-500"
                  : "text-slate-700 dark:text-slate-300"
              )}
            >
              {totalStock} pcs
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              className={cn(
                "text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5",
                status === "approved"
                  ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-100 dark:border-green-900/50"
                  : status === "pending"
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50"
                  : status === "rejected"
                  ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/50"
                  : status === "archived"
                  ? "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-100 dark:border-orange-900/50"
                  : "bg-slate-50 text-slate-700 dark:bg-slate-950/20 dark:text-slate-400 border border-slate-100 dark:border-slate-900/50"
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
        header: "Created",
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          return <span className="text-xs text-slate-500">{date.toLocaleDateString()}</span>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Link href={`/seller/products/${row.original.id}/edit`}>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600">
              <Edit2 className="h-4 w-4" />
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
            Products Catalog
          </h1>
          <p className="text-sm text-slate-500">
            Manage your store items, details, variants, and listing statuses.
          </p>
        </div>
        <Link href="/seller/products/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/10 gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      {/* Filtering & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 p-4 rounded-2xl backdrop-blur-md">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by title or brand..."
            className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40 h-10 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-sm text-slate-500">Loading products catalog...</p>
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
                Showing {table.getRowModel().rows.length} of {filteredData.length} products
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
            <PackageCheck className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-800 mb-3" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No products found</h3>
            <p className="text-sm text-slate-400 mt-1">Try resetting your search or add a new product.</p>
          </div>
        )}
      </div>
    </div>
  );
}

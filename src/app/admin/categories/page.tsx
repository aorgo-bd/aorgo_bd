"use client";

import React, { useState, useMemo } from "react";
import { useCategories } from "@/lib/hooks/useCategories";
import { Category } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Layers, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = useMemo(() => {
    return categories.filter((c: Category) => {
      const nameMatch = c.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const slugMatch = c.slug?.toLowerCase().includes(searchTerm.toLowerCase());
      const parentMatch = c.parent?.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || slugMatch || parentMatch;
    });
  }, [categories, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Product Categories
        </h1>
        <p className="text-sm text-slate-500">
          Review seeded categories, mapping positions, product aggregates, and local translations.
        </p>
      </div>

      {/* Filters */}
      <div className="relative max-w-md bg-white/60 dark:bg-slate-950/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search categories by name, slug, parent..."
          className="pl-10 bg-slate-50 border-transparent focus:bg-white transition-colors text-sm"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">Loading catalog taxonomy...</p>
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="font-bold text-xs py-4">Name</TableHead>
                <TableHead className="font-bold text-xs">Bangla name</TableHead>
                <TableHead className="font-bold text-xs">Slug ID</TableHead>
                <TableHead className="font-bold text-xs">Parent hierarchy</TableHead>
                <TableHead className="font-bold text-xs">Display order</TableHead>
                <TableHead className="font-bold text-xs text-right">Products attached</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-150 dark:divide-slate-800">
              {filteredCategories.map((c: Category) => (
                <TableRow key={c.slug} className="hover:bg-slate-50/30 transition-colors">
                  <TableCell className="py-4 font-bold text-slate-800 dark:text-slate-100">
                    {c.name}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-semibold text-slate-550">
                    {c.nameBn || "—"}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-mono text-slate-500">
                    {c.slug}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
                    {c.parent ? c.parent.replace(/-/g, " ") : "Top-level"}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-semibold text-slate-650">
                    Slot {c.order}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-black text-slate-700 dark:text-slate-200 text-right">
                    {c.productCount} items
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <Layers className="h-10 w-10 mx-auto mb-2 text-slate-350 dark:text-slate-800" />
          <p className="font-semibold text-slate-700 dark:text-slate-350">No categories found</p>
          <p className="text-xs text-slate-400">Try modifying search inputs.</p>
        </div>
      )}
    </div>
  );
}

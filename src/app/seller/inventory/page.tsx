"use client";

import React, { useMemo, useState } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { useSellerProducts } from "@/lib/hooks/useProducts";
import { getFreshIdToken } from "@/lib/firebase/client-token";
import { Product, ProductVariant } from "@/lib/types";
import { ProductImage } from "@/components/ProductImage";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Boxes,
  PackageX,
  AlertTriangle,
  Layers,
  Search,
  Save,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const LOW_STOCK_THRESHOLD = 5;

type StockEdits = Record<string, Record<string, number>>; // productId -> sku -> stock

export default function SellerInventoryPage() {
  const { user, firebaseUser } = useUser();
  const sellerUid = firebaseUser?.uid || user?.uid || "";
  const { data: products = [], isLoading, refetch } = useSellerProducts(sellerUid);

  const [edits, setEdits] = useState<StockEdits>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Current stock for a variant = local edit if present, otherwise stored value.
  const stockFor = (product: Product, sku: string, stored: number) =>
    edits[product.id]?.[sku] ?? stored;

  const setStock = (productId: string, sku: string, value: number) => {
    setEdits((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [sku]: value },
    }));
  };

  const isProductDirty = (product: Product) => {
    const productEdits = edits[product.id];
    if (!productEdits) return false;
    return (product.variants || []).some(
      (v) => productEdits[v.sku] !== undefined && productEdits[v.sku] !== v.stock
    );
  };

  // Aggregate KPIs across all variants of all products.
  const kpis = useMemo(() => {
    let totalUnits = 0;
    let skuCount = 0;
    let lowStock = 0;
    let outOfStock = 0;
    products.forEach((p: Product) => {
      (p.variants || []).forEach((v: ProductVariant) => {
        skuCount += 1;
        const s = edits[p.id]?.[v.sku] ?? v.stock;
        totalUnits += s;
        if (s === 0) outOfStock += 1;
        else if (s <= LOW_STOCK_THRESHOLD) lowStock += 1;
      });
    });
    return { totalUnits, skuCount, lowStock, outOfStock, productCount: products.length };
  }, [products, edits]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p: Product) =>
        p.title.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        (p.variants || []).some((v: ProductVariant) => v.sku.toLowerCase().includes(q))
    );
  }, [products, search]);

  const handleSave = async (product: Product) => {
    setSavingId(product.id);
    try {
      const idToken = await getFreshIdToken();
      const variants = (product.variants || []).map((v) => ({
        sku: v.sku,
        stock: stockFor(product, v.sku, v.stock),
      }));
      const res = await fetch(`/api/seller/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ variants }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update stock");

      // Clear this product's edits and pull fresh data.
      setEdits((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      await refetch();
      toast.success(`Stock updated for "${product.title}"`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update stock");
    } finally {
      setSavingId(null);
    }
  };

  const kpiCards = [
    { label: "Products", value: kpis.productCount, icon: Layers, color: "text-pink-500 bg-pink-50 dark:bg-pink-950/20" },
    { label: "Total SKUs", value: kpis.skuCount, icon: Boxes, color: "text-pink-500 bg-pink-50 dark:bg-pink-950/20" },
    { label: "Units in Stock", value: kpis.totalUnits.toLocaleString(), icon: Boxes, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
    { label: "Low Stock", value: kpis.lowStock, icon: AlertTriangle, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
    { label: "Out of Stock", value: kpis.outOfStock, icon: PackageX, color: "text-red-500 bg-red-50 dark:bg-red-950/20" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Boxes className="h-6 w-6 text-pink-500" /> Stock & Inventory
          </h1>
          <p className="text-sm text-slate-500">
            Monitor variant stock levels, catch low-stock SKUs, and update quantities inline.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, brand or SKU"
            className="pl-9"
          />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpiCards.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k.label}</p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{k.value}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${k.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          <p className="text-sm text-slate-500">Loading inventory...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-slate-400 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <Boxes className="h-12 w-12 mx-auto mb-2 text-slate-300 dark:text-slate-800" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {products.length === 0 ? "No products yet" : "No products match your search"}
          </p>
          <p className="text-xs">
            {products.length === 0 ? "Create a listing to start tracking stock." : "Try a different keyword."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product: Product) => {
            const dirty = isProductDirty(product);
            return (
              <Card key={product.id} className="border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60 overflow-hidden">
                <CardContent className="p-0">
                  {/* Product header */}
                  <div className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      {product.images?.[0] ? (
                        <ProductImage src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">{product.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400">{product.brand}</span>
                        <Badge variant="secondary" className={cn(
                          "text-[9px] uppercase px-1.5",
                          product.status === "approved" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30"
                          : product.status === "pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-900"
                        )}>
                          {product.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={!dirty || savingId === product.id}
                      onClick={() => handleSave(product)}
                      className="bg-pink-600 hover:bg-pink-700 text-white gap-1.5 disabled:opacity-50"
                    >
                      {savingId === product.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      {savingId === product.id ? "Saving" : "Save"}
                    </Button>
                  </div>

                  {/* Variants */}
                  <div className="divide-y divide-slate-50 dark:divide-slate-900">
                    {(product.variants || []).map((v: ProductVariant) => {
                      const value = stockFor(product, v.sku, v.stock);
                      const changed = value !== v.stock;
                      const level = value === 0 ? "out" : value <= LOW_STOCK_THRESHOLD ? "low" : "ok";
                      return (
                        <div key={v.sku} className="flex items-center gap-4 px-4 py-2.5">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">{v.size}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">{v.color}</span>
                            <span className="text-[10px] font-mono text-slate-400 truncate hidden sm:inline">{v.sku}</span>
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                              level === "out" ? "bg-red-50 text-red-600 dark:bg-red-950/30"
                              : level === "low" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30"
                              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
                            )}
                          >
                            {level === "out" ? "Out" : level === "low" ? "Low" : "In stock"}
                          </span>
                          <Input
                            type="number"
                            min={0}
                            value={value}
                            onChange={(e) => setStock(product.id, v.sku, Math.max(0, parseInt(e.target.value || "0", 10)))}
                            className={cn("h-8 w-24 text-sm", changed && "border-pink-500 ring-1 ring-pink-500")}
                          />
                        </div>
                      );
                    })}
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

"use client";

import React from "react";
import { Boxes } from "lucide-react";

export default function SellerInventoryPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 rounded-3xl p-8 backdrop-blur-md">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 mb-4">
        <Boxes className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Stock & Inventory</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        Monitor variant stocks, get low-stock alerts, manage barcode SKUs and batch update quantities.
      </p>
      <span className="mt-6 text-xs font-semibold px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-900/50 uppercase tracking-wider">
        Coming Soon in Day 7
      </span>
    </div>
  );
}

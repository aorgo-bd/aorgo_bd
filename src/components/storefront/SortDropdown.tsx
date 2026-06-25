"use client";

import React from "react";
import { ChevronDown, ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SortDropdownProps {
  value: string;
  onChange: (value: any) => void;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest Arrivals" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Customer Rating" },
  { value: "popular", label: "Best Sellers" },
];

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const currentLabel = SORT_OPTIONS.find((opt) => opt.value === value)?.label || "Newest Arrivals";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <button className="flex items-center gap-1.5 bg-gray-55 hover:bg-gray-100 border border-transparent rounded-full px-4 py-2 text-xs sm:text-sm font-bold text-black focus:outline-none transition-colors cursor-pointer">
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-500" />
          <span>{currentLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-550" />
        </button>
      } />
      <DropdownMenuContent align="end" className="bg-white border border-gray-100 shadow-xl rounded-xl p-1.5 min-w-[160px] z-50">
        {SORT_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`cursor-pointer rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
              opt.value === value ? "text-black font-extrabold bg-gray-50" : "text-gray-600"
            }`}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

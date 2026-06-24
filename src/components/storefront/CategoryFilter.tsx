"use client";

import React from "react";
import { SlidersHorizontal, Check, X } from "lucide-react";
import { Category } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

// Preset colors and sizes for fashion retail filters
const PRESET_COLORS = [
  { name: "Black", class: "bg-black text-white" },
  { name: "White", class: "bg-white border border-gray-200 text-black" },
  { name: "Blue", class: "bg-blue-600 text-white" },
  { name: "Red", class: "bg-red-600 text-white" },
  { name: "Green", class: "bg-green-600 text-white" },
  { name: "Yellow", class: "bg-yellow-400 text-black" },
  { name: "Pink", class: "bg-pink-400 text-white" },
  { name: "Grey", class: "bg-gray-500 text-white" },
];

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "38", "39", "40", "41", "42", "43", "44"];

interface CategoryFilterProps {
  subcategories: Category[];
  selectedSubcategories: string[];
  onSubcategoryToggle: (slug: string) => void;
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
  selectedColors: string[];
  onColorToggle: (color: string) => void;
  selectedSizes: string[];
  onSizeToggle: (size: string) => void;
  onClearFilters: () => void;
}

export default function CategoryFilter(props: CategoryFilterProps) {
  const {
    subcategories,
    selectedSubcategories,
    onSubcategoryToggle,
    minPrice,
    maxPrice,
    onPriceChange,
    selectedColors,
    onColorToggle,
    selectedSizes,
    onSizeToggle,
    onClearFilters,
  } = props;

  const renderFilterContent = () => (
    <div className="space-y-6">
      
      {/* Header (Title + Clear) */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <SlidersHorizontal className="h-4.5 w-4.5" />
          <span>Filters</span>
        </h3>
        <button
          onClick={onClearFilters}
          className="text-xs font-semibold text-gray-400 hover:text-black transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Subcategories checklist */}
      {subcategories.length > 0 && (
        <div className="space-y-3 pb-5 border-b border-gray-100">
          <h4 className="text-sm font-bold text-black uppercase tracking-wider">
            Categories
          </h4>
          <div className="space-y-2 flex flex-col">
            {subcategories.map((sub) => {
              const checked = selectedSubcategories.includes(sub.slug);
              return (
                <label
                  key={sub.slug}
                  className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-black cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onSubcategoryToggle(sub.slug)}
                    className="h-4 w-4 rounded-sm border-gray-300 text-black focus:ring-black accent-black"
                  />
                  <span className={checked ? "font-semibold text-black" : ""}>
                    {sub.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range inputs */}
      <div className="space-y-3 pb-5 border-b border-gray-100">
        <h4 className="text-sm font-bold text-black uppercase tracking-wider">
          Price Range (৳)
        </h4>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input
              type="number"
              placeholder="Min"
              value={minPrice || ""}
              onChange={(e) => onPriceChange(Number(e.target.value), maxPrice)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-black text-black"
            />
          </div>
          <span className="text-gray-400 text-sm">—</span>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Max"
              value={maxPrice || ""}
              onChange={(e) => onPriceChange(minPrice, Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-black text-black"
            />
          </div>
        </div>
      </div>

      {/* Colors filter */}
      <div className="space-y-3 pb-5 border-b border-gray-100">
        <h4 className="text-sm font-bold text-black uppercase tracking-wider">
          Colors
        </h4>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => {
            const isSelected = selectedColors.includes(c.name);
            return (
              <button
                key={c.name}
                title={c.name}
                onClick={() => onColorToggle(c.name)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 focus:outline-none ${c.class} ${
                  isSelected ? "ring-2 ring-black ring-offset-2" : ""
                }`}
              >
                {isSelected && (
                  <Check className={`h-4.5 w-4.5 ${c.name === "White" ? "text-black" : "text-white"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sizes filter */}
      <div className="space-y-3 pb-4">
        <h4 className="text-sm font-bold text-black uppercase tracking-wider">
          Sizes
        </h4>
        <div className="grid grid-cols-4 gap-1.5">
          {PRESET_SIZES.map((size) => {
            const isSelected = selectedSizes.includes(size);
            return (
              <button
                key={size}
                onClick={() => onSizeToggle(size)}
                className={`py-2 text-xs font-semibold rounded-lg text-center transition-colors focus:outline-none border ${
                  isSelected
                    ? "bg-black text-white border-black"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-transparent"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Filter Sidebar */}
      <div className="hidden lg:block w-[240px] xl:w-[260px] shrink-0 sticky top-24 self-start bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
        {renderFilterContent()}
      </div>

      {/* Mobile Filter Sheet Drawer Button */}
      <div className="block lg:hidden w-full">
        <Sheet>
          <SheetTrigger render={
            <button className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 text-sm font-bold text-gray-700 transition-colors">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters & Sorting</span>
            </button>
          } />
          <SheetContent side="bottom" className="h-[80vh] overflow-y-auto bg-white rounded-t-3xl p-6">
            <SheetHeader className="pb-2 border-b border-gray-100 flex-row items-center justify-between">
              <SheetTitle className="text-lg font-bold text-black">Filter Products</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              {renderFilterContent()}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

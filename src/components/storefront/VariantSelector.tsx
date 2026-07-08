"use client";

import React from "react";
import { ProductVariant } from "@/lib/types";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedSize: string;
  onSizeChange: (size: string) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const colorHexMap: Record<string, string> = {
  black: "#111111",
  white: "#FFFFFF",
  red: "#E11D48",
  blue: "#2563EB",
  navy: "#1E3A8A",
  "navy blue": "#1E3A8A",
  green: "#16A34A",
  yellow: "#EAB308",
  pink: "#DB2777",
  purple: "#7C3AED",
  orange: "#EA580C",
  gray: "#4B5563",
  grey: "#4B5563",
  brown: "#78350F",
  beige: "#F5F5DC",
  silver: "#D1D5DB",
  gold: "#CA8A04",
  cream: "#FAF5FF",
  charcoal: "#1F2937",
  teal: "#0D9488",
  burgundy: "#800020",
  maroon: "#7F1D1D",
  olive: "#3F6212",
  khaki: "#C2B280",
  peach: "#FFDAB9",
  lavender: "#E9D5FF",
  rust: "#B45309",
  mustard: "#CA8A04",
};

const getColorStyle = (colorName: string) => {
  const normalized = colorName.toLowerCase().trim();
  if (colorHexMap[normalized]) {
    return { backgroundColor: colorHexMap[normalized] };
  }
  for (const [key, hex] of Object.entries(colorHexMap)) {
    if (normalized.includes(key)) {
      return { backgroundColor: hex };
    }
  }
  // Fallback to light slate
  return {
    backgroundColor: "#F1F5F9",
  };
};

export default function VariantSelector({
  variants,
  selectedSize,
  onSizeChange,
  selectedColor,
  onColorChange,
}: VariantSelectorProps) {
  // Extract unique sizes and colors
  const sizes = Array.from(new Set(variants.map((v) => v.size)));
  const colors = Array.from(new Set(variants.map((v) => v.color)));

  // Availability checks
  const isSizeAvailable = (size: string) => {
    if (selectedColor) {
      // If a color is selected, check if this size has stock for that color
      return variants.some(
        (v) => v.size === size && v.color === selectedColor && v.stock > 0
      );
    }
    // Otherwise check if this size has stock in any variant
    return variants.some((v) => v.size === size && v.stock > 0);
  };

  const isColorAvailable = (color: string) => {
    if (selectedSize) {
      // If a size is selected, check if this color has stock for that size
      return variants.some(
        (v) => v.color === color && v.size === selectedSize && v.stock > 0
      );
    }
    // Otherwise check if this color has stock in any variant
    return variants.some((v) => v.color === color && v.stock > 0);
  };

  return (
    <div className="space-y-6">
      {/* 1. Color Selector */}
      {colors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-ink-700 uppercase tracking-wider">
              Select Color
            </span>
            {selectedColor && (
              <span className="text-xs font-semibold text-gray-500 capitalize bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                {selectedColor}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const available = isColorAvailable(color);
              const selected = selectedColor === color;

              return (
                <button
                  key={color}
                  onClick={() => available && onColorChange(color)}
                  disabled={!available}
                  className={`group relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    selected
                      ? "border-pink-500 scale-105"
                      : "border-ink-200 hover:border-ink-400"
                  } ${!available ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                  title={color + (!available ? " (Out of Stock)" : "")}
                >
                  <span
                    className={`w-8.5 h-8.5 rounded-full border border-black/5 flex items-center justify-center transition-transform ${
                      selected ? "scale-95" : "group-hover:scale-95"
                    }`}
                    style={getColorStyle(color)}
                  >
                    {/* Tick for selected white or very light colors */}
                    {selected && (
                      <span
                        className={`h-2 w-2 rounded-full ${
                          color.toLowerCase().trim() === "white" || color.toLowerCase().trim() === "cream"
                            ? "bg-black"
                            : "bg-white"
                        }`}
                      />
                    )}
                  </span>

                  {/* Diagonal line for out of stock */}
                  {!available && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-[120%] h-0.5 bg-gray-400/80 rotate-45 transform origin-center" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Size Selector */}
      {sizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-ink-700 uppercase tracking-wider">
              Select Size
            </span>
            {selectedSize && (
              <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                Size {selectedSize}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {sizes.map((size) => {
              const available = isSizeAvailable(size);
              const selected = selectedSize === size;

              return (
                <button
                  key={size}
                  onClick={() => available && onSizeChange(size)}
                  disabled={!available}
                  className={`min-w-12 h-12 px-4 rounded-sm border text-sm font-bold transition-colors relative overflow-hidden flex items-center justify-center uppercase ${
                    selected
                      ? "border-pink-500 bg-pink-50 text-pink-500"
                      : available
                      ? "border-ink-300 bg-white text-ink-700 hover:border-pink-400 hover:text-pink-500"
                      : "border-ink-200 bg-ink-50 text-ink-300 cursor-not-allowed"
                  }`}
                >
                  <span>{size}</span>

                  {/* Diagonal line for out of stock */}
                  {!available && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-[150%] h-[1px] bg-gray-300/80 rotate-45 transform origin-center" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { ProductVariant } from "@/lib/types";
import { colorToHex, isLightColor } from "@/lib/utils";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedSize: string;
  onSizeChange: (size: string) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const getColorStyle = (colorName: string) => ({
  backgroundColor: colorToHex(colorName),
});

/** "Default"/blank are placeholder colors sellers use for single-colour items. */
const isPlaceholderColor = (color: string) =>
  !color || color.toLowerCase().trim() === "default";

export default function VariantSelector({
  variants,
  selectedSize,
  onSizeChange,
  selectedColor,
  onColorChange,
}: VariantSelectorProps) {
  // Extract unique sizes and real (non-placeholder) colors.
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));
  const colors = Array.from(
    new Set(variants.map((v) => v.color).filter((c) => !isPlaceholderColor(c)))
  );

  // A size is offered for the currently selected colour (or any colour if none
  // is picked yet) and has stock.
  const isSizeAvailable = (size: string) => {
    if (selectedColor) {
      return variants.some(
        (v) => v.size === size && v.color === selectedColor && v.stock > 0
      );
    }
    return variants.some((v) => v.size === size && v.stock > 0);
  };

  // Colour is the primary axis (like Myntra): a colour is available as long as
  // ANY size of it is in stock — it must NOT be gated by the size already
  // chosen, otherwise switching colour gets stuck on out-of-stock combos.
  const isColorAvailable = (color: string) =>
    variants.some((v) => v.color === color && v.stock > 0);

  // Selecting a colour: if the size already chosen isn't offered for the new
  // colour, clear it so the shopper re-picks a valid size.
  const handleColorSelect = (color: string) => {
    if (!isColorAvailable(color)) return;
    onColorChange(color);
    if (
      selectedSize &&
      !variants.some((v) => v.color === color && v.size === selectedSize && v.stock > 0)
    ) {
      onSizeChange("");
    }
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
                  type="button"
                  onClick={() => handleColorSelect(color)}
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
                    {/* Tick for selected color (dark tick on light swatches) */}
                    {selected && (
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isLightColor(color) ? "bg-black" : "bg-white"
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

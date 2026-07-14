import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format an integer amount of Bangladeshi Taka with thousands separators.
 * e.g. formatBDT(12500) => "৳12,500"
 */
export function formatBDT(amount: number | null | undefined): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0
  return `৳${value.toLocaleString("en-BD")}`
}

/**
 * Resolve the discount percentage for a product. Prefers the explicit
 * `discountPercent` field, otherwise derives it from compare vs. sale price.
 */
export function getDiscountPercent(product: {
  price: number
  comparePrice?: number
  discountPercent?: number
}): number {
  if (product.discountPercent && product.discountPercent > 0) return product.discountPercent
  if (product.comparePrice && product.comparePrice > product.price) {
    return Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
  }
  return 0
}

/**
 * Canonical color-name → hex map used by product swatches across the app
 * (product cards, PDP variant selector). Shared so a color always renders the
 * same real circle everywhere instead of the plain text label.
 */
export const COLOR_HEX_MAP: Record<string, string> = {
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
  beige: "#E8DCC4",
  silver: "#D1D5DB",
  gold: "#CA8A04",
  cream: "#F5EFE0",
  charcoal: "#1F2937",
  teal: "#0D9488",
  burgundy: "#800020",
  maroon: "#7F1D1D",
  olive: "#3F6212",
  khaki: "#C2B280",
  peach: "#FFDAB9",
  lavender: "#C4B5FD",
  rust: "#B45309",
  mustard: "#CA8A04",
}

/**
 * Return the hex color for a named color, tolerating multi-word names
 * ("Navy Blue"), casing, and partial matches. Falls back to a light slate so a
 * swatch is always rendered.
 */
export function colorToHex(colorName: string): string {
  const normalized = (colorName || "").toLowerCase().trim()
  if (COLOR_HEX_MAP[normalized]) return COLOR_HEX_MAP[normalized]
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (normalized.includes(key)) return hex
  }
  return "#E2E8F0"
}

/** True for near-white swatches that need a dark tick/ring for contrast. */
export function isLightColor(colorName: string): boolean {
  const normalized = (colorName || "").toLowerCase().trim()
  return ["white", "cream", "beige", "silver"].some((c) => normalized.includes(c))
}

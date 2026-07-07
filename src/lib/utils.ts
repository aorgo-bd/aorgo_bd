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

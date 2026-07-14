"use client";

import React, { useState } from "react";
import { Truck, BadgeCheck, MapPin } from "lucide-react";

interface DeliveryEstimate {
  minDays: number;
  maxDays: number;
  area: string;
}

/** Format `today + n days` as e.g. "Sat, 19 Jul". */
function formatDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/**
 * "Delivery Check" (spec #13) — shopper enters a BD postal code and gets an
 * estimated delivery window plus COD availability. AORGO is Cash-on-Delivery
 * across Bangladesh, so COD is always available; Dhaka-metro codes (1xxx) get a
 * faster window than the rest of the country.
 */
export default function DeliveryCheck() {
  const [pin, setPin] = useState("");
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [error, setError] = useState("");

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pin.trim();
    if (!/^\d{4}$/.test(trimmed)) {
      setEstimate(null);
      setError("Enter a valid 4-digit BD postal code");
      return;
    }
    setError("");
    // Dhaka metro postal codes start with 1 → faster delivery.
    const isDhaka = trimmed.startsWith("1");
    setEstimate(
      isDhaka
        ? { minDays: 2, maxDays: 3, area: "Dhaka Metro" }
        : { minDays: 3, maxDays: 5, area: "Bangladesh" }
    );
  };

  return (
    <div className="space-y-3">
      <span className="text-sm font-bold text-ink-700 uppercase tracking-wider block">
        Delivery Options
      </span>

      <form onSubmit={handleCheck} className="flex items-stretch gap-2 max-w-sm">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter postal code"
            className="w-full h-11 pl-9 pr-3 text-sm font-medium text-ink-900 placeholder:text-ink-400 bg-white border border-ink-300 rounded-sm focus:outline-none focus:border-pink-400 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="h-11 px-5 text-xs font-bold uppercase tracking-widest text-pink-500 border border-pink-300 rounded-sm hover:bg-pink-500 hover:text-white transition-colors shrink-0"
        >
          Check
        </button>
      </form>

      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

      {estimate && (
        <div className="rounded-sm border border-ink-200 bg-ink-50/60 p-3 space-y-2 max-w-sm">
          <div className="flex items-center gap-2 text-sm text-ink-700">
            <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              Delivery by {formatDate(estimate.minDays)} – {formatDate(estimate.maxDays)}
            </span>
          </div>
          <p className="text-[11px] text-ink-500 pl-6">
            Est. {estimate.minDays}–{estimate.maxDays} business days to {estimate.area}
          </p>
          <div className="flex items-center gap-2 text-sm text-ink-700 pt-1 border-t border-ink-200/70">
            <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Cash on Delivery available</span>
          </div>
        </div>
      )}
    </div>
  );
}

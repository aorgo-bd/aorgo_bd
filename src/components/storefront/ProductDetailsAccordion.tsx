"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Product } from "@/lib/types";

interface AccordionRow {
  key: string;
  label: string;
  content: React.ReactNode;
}

/**
 * "Product Details" accordion (spec #13) — Material, Fit, Country, Care, Return
 * and Warranty. Seller-provided values come from `product.attributes`; the
 * marketplace-wide policies (returns, warranty, care, country) fall back to
 * sensible AORGO defaults so every product shows a complete spec sheet.
 */
export default function ProductDetailsAccordion({ product }: { product: Product }) {
  const attrs = product.attributes || {};
  const [open, setOpen] = useState<string | null>("description");

  const cap = (v: unknown) =>
    typeof v === "string" && v.length > 0 ? v.charAt(0).toUpperCase() + v.slice(1) : "";

  const material = attrs.fabric ? cap(attrs.fabric) : "";
  const fit = attrs.fit ? `${cap(attrs.fit)} fit` : "";
  const country = (attrs.country as string) || "Made in Bangladesh";
  const care =
    (attrs.care as string) ||
    "Machine wash cold with like colours. Do not bleach. Tumble dry low. Warm iron if needed.";
  const warranty = (attrs.warranty as string) || "Manufacturer / seller warranty as applicable.";

  const rows: AccordionRow[] = [
    {
      key: "description",
      label: "Description",
      content: (
        <p className="text-sm text-ink-600 leading-relaxed">{product.description}</p>
      ),
    },
  ];

  // Specifications row from real attributes (material, fit, occasion, …).
  const specs: { k: string; v: string }[] = [];
  if (material) specs.push({ k: "Material", v: material });
  if (fit) specs.push({ k: "Fit", v: fit });
  Object.entries(attrs).forEach(([k, v]) => {
    if (["fabric", "fit", "country", "care", "warranty"].includes(k)) return;
    if (!v || (Array.isArray(v) && v.length === 0)) return;
    specs.push({ k: cap(k), v: Array.isArray(v) ? v.map(cap).join(", ") : cap(String(v)) });
  });

  if (specs.length > 0) {
    rows.push({
      key: "specs",
      label: "Material & Fit",
      content: (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {specs.map((s) => (
            <div key={s.k} className="space-y-0.5">
              <dt className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">{s.k}</dt>
              <dd className="text-sm font-semibold text-ink-900">{s.v}</dd>
            </div>
          ))}
        </dl>
      ),
    });
  }

  rows.push(
    {
      key: "country",
      label: "Country of Origin",
      content: <p className="text-sm text-ink-600">{country}</p>,
    },
    {
      key: "care",
      label: "Care Instructions",
      content: <p className="text-sm text-ink-600 leading-relaxed">{care}</p>,
    },
    {
      key: "return",
      label: "Returns & Exchange",
      content: (
        <p className="text-sm text-ink-600 leading-relaxed">
          7-day easy returns. Items must be unused, unwashed and returned with original tags and
          packaging. Refunds are processed after the seller inspects the returned item.
        </p>
      ),
    },
    {
      key: "warranty",
      label: "Warranty",
      content: <p className="text-sm text-ink-600 leading-relaxed">{warranty}</p>,
    }
  );

  return (
    <div className="border-t border-ink-100">
      {rows.map((row) => {
        const isOpen = open === row.key;
        return (
          <div key={row.key} className="border-b border-ink-100">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : row.key)}
              className="w-full flex items-center justify-between gap-3 py-3.5 text-left group"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-bold text-ink-900 uppercase tracking-wider">
                {row.label}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-ink-500 shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-200 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="pb-4">{row.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Category } from "@/lib/types";

interface FeaturedCategoriesProps {
  categories: Category[];
}

// Two rows on mobile (3 columns) = 6 tiles shown up front; the rest sit behind
// a "See more" toggle so the section never grows past two rows on load.
const INITIAL_VISIBLE = 6;

/**
 * "Shop by Category" — a Myntra-style grid of popular fashion categories with
 * large rounded images. Data-driven from the `categories` collection
 * (subcategories preferred, falling back to top-level), so admins can
 * add/replace images, rename, and reorder entirely from the Admin Panel.
 */
export default function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  const [expanded, setExpanded] = useState(false);

  const subcategories = categories
    .filter((c) => c.parent)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const roots = categories
    .filter((c) => !c.parent)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Prefer leaf categories (T-Shirts, Kurtas, …); fall back to top-level if a
  // store hasn't seeded subcategories yet.
  const source = subcategories.length >= 4 ? subcategories : roots;
  const featured = source.slice(0, 12);

  if (featured.length === 0) return null;

  const visible = expanded ? featured : featured.slice(0, INITIAL_VISIBLE);
  const hasMore = featured.length > INITIAL_VISIBLE;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg sm:text-2xl font-display font-black tracking-wide text-ink-900">
          Shop by Category
        </h2>
      </div>
      {/* Capped at two rows on load; "See more" reveals the remainder. */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {visible.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="group flex flex-col items-center gap-2 rounded-2xl bg-white border border-ink-100 p-2.5 sm:p-3 shadow-[0_1px_3px_rgba(40,44,63,0.06)] hover:shadow-[0_10px_26px_rgba(40,44,63,0.12)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-ink-50">
              <Image
                src={cat.image || "/images/products/placeholder.webp"}
                alt={cat.name}
                fill
                sizes="(max-width:640px) 30vw, (max-width:1024px) 22vw, 15vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <span className="text-[11px] sm:text-sm font-bold text-ink-800 text-center truncate w-full group-hover:text-pink-500 transition-colors">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-5">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-5 py-2 text-xs font-bold uppercase tracking-widest text-ink-700 hover:border-pink-300 hover:text-pink-500 transition-colors shadow-2xs"
          >
            {expanded ? (
              <>
                See Less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                See More <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}

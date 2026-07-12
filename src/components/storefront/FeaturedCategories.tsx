import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Category } from "@/lib/types";

interface FeaturedCategoriesProps {
  categories: Category[];
}

/**
 * "Featured Categories" — a Myntra-style two-row grid of popular fashion
 * categories with large rounded images. Data-driven from the `categories`
 * collection (subcategories preferred, falling back to top-level), so admins
 * can add/replace images, rename, and reorder entirely from the Admin Panel.
 */
export default function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  const subcategories = categories
    .filter((c) => c.parent)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const roots = categories
    .filter((c) => !c.parent)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Prefer leaf categories (T-Shirts, Kurtas, …); fall back to top-level if a
  // store hasn't seeded subcategories yet. Show up to 8 across two rows.
  const source = subcategories.length >= 4 ? subcategories : roots;
  const featured = source.slice(0, 8);

  if (featured.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
      <div className="mb-6 border-b border-ink-200 pb-3">
        <h2 className="text-xl sm:text-2xl font-display font-black tracking-widest text-ink-900 uppercase">
          Featured Categories
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
        {featured.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="group flex flex-col items-center gap-2.5"
          >
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-ink-100 border border-ink-200 shadow-2xs group-hover:shadow-md transition-all">
              <Image
                src={cat.image || "/images/products/placeholder.webp"}
                alt={cat.name}
                fill
                sizes="(max-width:640px) 45vw, 22vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <span className="text-xs sm:text-sm font-bold text-ink-800 text-center uppercase tracking-wider group-hover:text-pink-500 transition-colors">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

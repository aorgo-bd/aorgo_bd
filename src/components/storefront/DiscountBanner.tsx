import React from "react";
import Link from "next/link";
import { BadgeCheck, ArrowRight } from "lucide-react";
import type { HomepageDiscountBanner } from "@/lib/types";
import { DEFAULT_HOMEPAGE } from "@/lib/data/homepage-defaults";

/**
 * AORGO signature discount banner (spec #8) — a single, uncluttered gradient
 * strip (orange → coral → pink → soft purple) that carries the brand's promo
 * message and links into the sale feed. Content is admin-managed via
 * Admin → Homepage (falls back to the default copy).
 */
export default function DiscountBanner({ config }: { config?: HomepageDiscountBanner }) {
  const { eyebrow, headline, trustLine, ctaLabel, link } = config ?? DEFAULT_HOMEPAGE.discountBanner;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-10">
      <Link
        href={link || "/products"}
        className="relative block overflow-hidden rounded-[20px] bg-gradient-to-r from-[#FF7A45] via-[#FF4E7E] to-[#A855F7] shadow-[0_10px_30px_rgba(255,78,126,0.25)] transition-transform duration-300 hover:scale-[1.005] group"
      >
        {/* Decorative soft glows */}
        <span className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <span className="pointer-events-none absolute right-24 bottom-[-40px] h-40 w-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-center justify-between gap-4 px-6 sm:px-10 py-7 sm:py-9">
          <div className="text-white space-y-1.5">
            {eyebrow && (
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/85">
                {eyebrow}
              </p>
            )}
            <h2 className="text-3xl sm:text-5xl font-display font-black tracking-wide leading-none">
              {headline}
            </h2>
            {trustLine && (
              <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white/95 pt-1">
                <BadgeCheck className="h-4 w-4" />
                {trustLine}
              </p>
            )}
          </div>

          {ctaLabel && (
            <span className="hidden sm:inline-flex items-center gap-2 shrink-0 bg-white text-ink-900 font-bold text-sm rounded-full px-5 py-2.5 shadow-md group-hover:gap-3 transition-all">
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </Link>
    </section>
  );
}

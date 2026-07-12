import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * "Shop by Price" section — four clickable price-ceiling cards that route into
 * the All Products feed pre-filtered by `maxPrice`. Prices are in BDT (integer
 * taka) per the AORGO currency rule. The tiers can be swapped here without any
 * backend change.
 */
const PRICE_TIERS = [
  { max: 499, label: "Under ৳499", accent: "from-[#FDE7EF] to-[#FBCFE0]", text: "text-pink-700" },
  { max: 999, label: "Under ৳999", accent: "from-[#E7EEFD] to-[#CFDBFB]", text: "text-indigo-700" },
  { max: 1499, label: "Under ৳1499", accent: "from-[#E7FDF2] to-[#CFFBE4]", text: "text-emerald-700" },
  { max: 1999, label: "Under ৳1999", accent: "from-[#FDF6E7] to-[#FBEECF]", text: "text-amber-700" },
];

export default function ShopByPrice() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
      <div className="mb-6 border-b border-ink-200 pb-3">
        <h2 className="text-xl sm:text-2xl font-display font-black tracking-widest text-ink-900 uppercase">
          Shop by Price
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {PRICE_TIERS.map((tier) => (
          <Link
            key={tier.max}
            href={`/products?maxPrice=${tier.max}`}
            className={`relative block bg-gradient-to-br ${tier.accent} rounded-sm p-5 sm:p-6 aspect-[16/10] sm:aspect-[16/9] overflow-hidden shadow-2xs hover:shadow-md border border-white/60 transition-all group`}
          >
            <div className="flex flex-col justify-between h-full">
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-ink-500">
                Fashion Finds
              </span>
              <div>
                <p className={`text-lg sm:text-2xl font-display font-black uppercase leading-tight ${tier.text}`}>
                  {tier.label}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-ink-700 mt-1 group-hover:gap-2 transition-all">
                  Shop Now <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

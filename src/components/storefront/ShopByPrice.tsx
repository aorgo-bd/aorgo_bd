import React from "react";
import Link from "next/link";
import { ShoppingBag, ShoppingBasket, Tag, Gift } from "lucide-react";

/**
 * "Shop by Price" section (spec #11) — four gradient price-ceiling cards, each
 * with a shopping illustration icon, that route into the All Products feed
 * pre-filtered by `maxPrice`. Prices are in BDT (integer taka).
 */
const PRICE_TIERS = [
  {
    max: 499,
    label: "Under ৳499",
    gradient: "from-[#EDE9FE] to-[#DDD6FE]",
    text: "text-violet-700",
    iconBg: "bg-violet-500",
    Icon: ShoppingBag,
  },
  {
    max: 999,
    label: "Under ৳999",
    gradient: "from-[#FFEDD5] to-[#FED7AA]",
    text: "text-orange-700",
    iconBg: "bg-orange-500",
    Icon: ShoppingBasket,
  },
  {
    max: 1499,
    label: "Under ৳1499",
    gradient: "from-[#DCFCE7] to-[#BBF7D0]",
    text: "text-emerald-700",
    iconBg: "bg-emerald-500",
    Icon: Tag,
  },
  {
    max: 1999,
    label: "Under ৳1999",
    gradient: "from-[#FCE7F3] to-[#FBCFE8]",
    text: "text-pink-700",
    iconBg: "bg-pink-500",
    Icon: Gift,
  },
];

export default function ShopByPrice() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg sm:text-2xl font-display font-black tracking-wide text-ink-900">
          Shop by Price
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {PRICE_TIERS.map(({ max, label, gradient, text, iconBg, Icon }) => (
          <Link
            key={max}
            href={`/products?maxPrice=${max}`}
            className={`relative block bg-gradient-to-br ${gradient} rounded-[20px] p-5 sm:p-6 overflow-hidden shadow-[0_2px_10px_rgba(40,44,63,0.06)] hover:shadow-[0_10px_28px_rgba(40,44,63,0.14)] transition-all duration-300 hover:-translate-y-0.5 group`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-ink-500">
                  Starting
                </span>
                <p className={`text-lg sm:text-2xl font-display font-black leading-tight ${text}`}>
                  {label}
                </p>
                <span className="text-[11px] font-bold text-ink-600 mt-1.5 group-hover:underline">
                  Shop Now →
                </span>
              </div>
              <span
                className={`flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-2xl ${iconBg} text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}
              >
                <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

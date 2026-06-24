"use client";

import React from "react";
import { Truck, RotateCcw, ShieldCheck } from "lucide-react";

export default function TrustBadges() {
  const badges = [
    {
      icon: ShieldCheck,
      title: "100% Authentic",
      desc: "Direct from verified stores",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100/50",
    },
    {
      icon: Truck,
      title: "COD Available",
      desc: "Pay when you receive",
      color: "text-blue-600 bg-blue-50 border-blue-100/50",
    },
    {
      icon: RotateCcw,
      title: "7-Day Returns",
      desc: "Easy exchanges & returns",
      color: "text-rose-600 bg-rose-50 border-rose-100/50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 py-6 border-y border-gray-100">
      {badges.map((b) => {
        const Icon = b.icon;
        return (
          <div
            key={b.title}
            className="flex items-start sm:items-center gap-3.5 p-3 rounded-2xl border border-gray-100/60 hover:border-gray-200 bg-white hover:bg-gray-50/30 transition-all duration-300 group"
          >
            <div className={`p-2.5 rounded-xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${b.color}`}>
              <Icon className="h-5 w-5 stroke-[2px]" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-gray-900 tracking-wide uppercase">
                {b.title}
              </h4>
              <p className="text-[10px] sm:text-xs text-gray-400 font-medium leading-relaxed">
                {b.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// src/components/ui/myntra/Logo.tsx
import React from "react";

export function Logo({ className = "h-7 sm:h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 36" className={className} aria-label="AORGO">
      <defs>
        <linearGradient id="aorgoGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#FF3F6C" />
          <stop offset="100%" stopColor="#FF905A" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="28"
        fontFamily="var(--font-display), Bebas Neue, Arial Black, sans-serif"
        fontSize="32"
        fontWeight="900"
        fill="url(#aorgoGrad)"
        letterSpacing="2"
      >
        AORGO
      </text>
      <circle cx="132" cy="12" r="4" fill="#FF3F6C" />
    </svg>
  );
}

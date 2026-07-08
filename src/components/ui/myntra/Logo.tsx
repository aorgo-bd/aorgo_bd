// src/components/ui/myntra/Logo.tsx
import React from "react";

export function Logo({ className = "h-7 sm:h-8" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.webp"
      alt="AORGO"
      className={`${className} w-auto object-contain`}
    />
  );
}

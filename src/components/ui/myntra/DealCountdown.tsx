// src/components/ui/myntra/DealCountdown.tsx
"use client";

import React, { useEffect, useState } from "react";

export function DealCountdown({ endsAt }: { endsAt: number }) {
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === 0) {
    return <span className="text-xs font-bold text-ink-400 uppercase tracking-widest animate-pulse">Loading...</span>;
  }

  const diff = Math.max(0, endsAt - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);

  return (
    <span className="inline-flex items-center gap-1.5 font-bold text-ink-900 text-xs tracking-wider">
      ENDS IN
      <Cell>{String(h).padStart(2, "0")}h</Cell>
      <Cell>{String(m).padStart(2, "0")}m</Cell>
      <Cell>{String(s).padStart(2, "0")}s</Cell>
    </span>
  );
}

const Cell = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-[#FF3F6C] text-white rounded-sm px-1.5 py-0.5 text-xs font-black tabular-nums tracking-wider shadow-2xs">
    {children}
  </span>
);

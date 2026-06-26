"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical root-level application crash:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-3xl shadow-xl text-center space-y-6">
          <div className="text-4xl">🚨</div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Critical Error</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              A high-priority application crash occurred. The system could not initialize the base framework:
              <span className="block mt-2 font-mono text-xs bg-slate-50 p-2.5 rounded-lg text-red-600 border border-slate-100 truncate max-w-full">
                {error.message || "Root rendering failed"}
              </span>
            </p>
          </div>
          <button
            onClick={reset}
            className="w-full h-11 bg-black hover:bg-black/90 text-white font-bold rounded-xl transition-all uppercase tracking-wider text-xs shadow-xs"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}

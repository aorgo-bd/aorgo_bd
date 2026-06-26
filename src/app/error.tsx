"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime error caught at root:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-indigo-50/10 to-slate-100 dark:from-slate-950 dark:via-indigo-950/10 dark:to-slate-900">
      <div className="text-center max-w-md w-full space-y-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl backdrop-blur-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-600 mx-auto mb-2">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-850 dark:text-slate-100">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed">
            An unexpected error occurred while rendering this page:
            <span className="block mt-2 font-mono text-xs bg-slate-50 p-2.5 rounded-lg text-red-650 border border-slate-150 truncate max-w-full">
              {error.message || "Unknown runtime crash"}
            </span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={reset}
            className="w-full sm:w-auto gap-2 bg-black hover:bg-black/90 font-bold uppercase tracking-wider text-xs h-10 rounded-xl"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Try again
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2 border-slate-200 dark:border-slate-800 dark:hover:bg-slate-900 font-bold uppercase tracking-wider text-xs h-10 rounded-xl"
            >
              <Home className="h-3.5 w-3.5" /> Back Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

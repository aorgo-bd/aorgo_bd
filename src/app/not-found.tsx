"use client";

import Link from "next/link";
import { ArrowLeft, Home, HelpCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-pink-50/20 to-slate-100 dark:from-slate-950 dark:via-pink-950/20 dark:to-slate-900">
      <div className="text-center max-w-md w-full space-y-6">
        <div className="relative">
          {/* Decorative Background Glows */}
          <div className="absolute inset-0 bg-pink-500/10 blur-3xl rounded-full -z-10" />
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-pink-600 to-pink-700 dark:from-pink-400 dark:to-pink-400 select-none leading-none tracking-tighter">
            404
          </h1>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Page Not Found
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            The page you are looking for doesn&apos;t exist or has been moved. Discover our collections or return to the homepage.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/">
            <Button className="w-full sm:w-auto gap-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold shadow-lg shadow-pink-600/10">
              <Home className="h-4 w-4" /> Go back home
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" className="w-full sm:w-auto gap-2 border-slate-200 dark:border-slate-800 dark:hover:bg-slate-900 font-semibold">
              <ShoppingBag className="h-4 w-4" /> Discover Products
            </Button>
          </Link>
        </div>

        {/* Footer Support Info */}
        <div className="pt-8 text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Need help? Contact support at support@aorgo.com</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Store as StoreIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { toast } from "sonner";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, role } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isRegisterPage = pathname === "/seller/register";

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (isRegisterPage && (role === "seller" || role === "admin")) {
      router.replace("/seller/dashboard");
      return;
    }

    if (!isRegisterPage && role !== "seller" && role !== "admin") {
      router.replace("/seller/register");
    }
  }, [isAuthenticated, isLoading, isRegisterPage, pathname, role, router]);

  // Handle Loading State
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50/20 via-slate-50 to-indigo-100/20 dark:from-slate-950 dark:to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading Seller Portal...</p>
        </div>
      </div>
    );
  }

  // Handle Authentication Guard
  if (!isAuthenticated) {
    return null;
  }

  // Guard for Seller Registration Page
  if (isRegisterPage) {
    if (role === "seller" || role === "admin") {
      return null;
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {children}
      </div>
    );
  }

  // Guard for all other seller routes
  if (role !== "seller" && role !== "admin") {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "Failed to log out");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
    { label: "Products", href: "/seller/products", icon: Package },
    { label: "Orders", href: "/seller/orders", icon: ShoppingCart },
    { label: "Inventory", href: "/seller/inventory", icon: Boxes },
    { label: "Analytics", href: "/seller/analytics", icon: BarChart3 },
    { label: "Settings", href: "/seller/settings", icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-100 dark:bg-slate-950">
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30 text-white font-bold text-lg">
            A
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              AORGO
            </span>
            <span className="block text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Seller Hub
            </span>
          </div>
        </div>

        <nav className="mt-8 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-transform duration-200", !isActive && "group-hover:scale-110")} />
                {item.label}
                {isActive && (
                  <span className="absolute right-3 h-2 w-2 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile info */}
      <div className="border-t border-slate-800 p-4 bg-slate-900/50">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-9 w-9 border border-indigo-500/30">
            <AvatarImage src={user?.photoURL} />
            <AvatarFallback className="bg-indigo-950 text-indigo-200 uppercase">
              {user?.displayName?.substring(0, 2) || user?.email?.substring(0, 2) || "S"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate text-slate-100">
              {user?.displayName || "Seller Partner"}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full mt-2 justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 md:block flex-shrink-0 border-r border-slate-200 dark:border-slate-800 shadow-sm z-30">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 dark:border-slate-800 z-20">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-600 dark:text-slate-300"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <StoreIcon className="h-5 w-5 text-indigo-500" />
              Seller Portal
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hidden text-xs font-semibold text-indigo-600 hover:underline md:block dark:text-indigo-400"
            >
              View Storefront
            </Link>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 uppercase">
              {role}
            </span>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            />
            {/* Drawer */}
            <div className="relative flex w-64 max-w-xs flex-col bg-slate-900 shadow-2xl animate-in slide-in-from-left duration-200">
              <button
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                onClick={() => setIsMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

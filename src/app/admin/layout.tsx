"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Users,
  Image as ImageIcon,
  Layers,
  BarChart3,
  Menu,
  X,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { toast } from "sonner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, role } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (role !== "admin") {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, pathname, role, router]);

  // Handle Loading State
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-violet-50/20 via-slate-50 to-violet-100/20 dark:from-slate-950 dark:to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  // Handle Authentication Guard
  if (!isAuthenticated) {
    return null;
  }

  // Guard for Admin role check
  if (role !== "admin") {
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
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Sellers", href: "/admin/sellers", icon: Store },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Banners", href: "/admin/banners", icon: ImageIcon },
    { label: "Categories", href: "/admin/categories", icon: Layers },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between bg-slate-950 text-slate-100">
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-md shadow-violet-500/30 text-white font-bold text-lg">
            A
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-violet-200 to-fuchsia-400 bg-clip-text text-transparent">
              AORGO
            </span>
            <span className="block text-xs font-semibold uppercase tracking-wider text-violet-400">
              Admin Control
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
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
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
      <div className="border-t border-slate-900 p-4 bg-slate-950">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-9 w-9 border border-violet-500/30">
            <AvatarImage src={user?.photoURL} />
            <AvatarFallback className="bg-violet-950 text-violet-200 uppercase">
              {user?.displayName?.substring(0, 2) || user?.email?.substring(0, 2) || "AD"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate text-slate-100">
              {user?.displayName || "System Admin"}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full mt-2 justify-start gap-3 text-slate-400 hover:text-red-450 hover:bg-red-950/20 transition-colors"
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
              <ShieldCheck className="h-5 w-5 text-violet-500" />
              Admin Portal
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hidden text-xs font-semibold text-violet-600 hover:underline md:block dark:text-violet-400"
            >
              View Storefront
            </Link>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
            <span className="rounded-full bg-violet-50 dark:bg-violet-950/30 px-3 py-1 text-xs font-semibold text-violet-750 dark:text-violet-400 border border-violet-100 dark:border-violet-900/50 uppercase">
              System Admin
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
            <div className="relative flex w-64 max-w-xs flex-col bg-slate-950 shadow-2xl animate-in slide-in-from-left duration-200">
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

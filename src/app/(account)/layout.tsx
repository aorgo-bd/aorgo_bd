"use client";

import { useUser } from "@/lib/hooks/useUser";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { User as UserIcon, Package, MapPin, Heart, Settings, Store, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, role } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-black border-t-transparent" />
          <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const items = [
    { href: "/profile",           label: "Overview",      icon: UserIcon },
    { href: "/profile/orders",    label: "My Orders",     icon: Package },
    { href: "/profile/addresses", label: "Addresses",     icon: MapPin },
    { href: "/wishlist",          label: "Wishlist",      icon: Heart },
    { href: "/profile/settings",  label: "Settings",      icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      document.cookie = "firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      toast.success("Successfully logged out");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to log out");
    }
  };

  return (
    <div className="bg-slate-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="space-y-1 bg-white border border-gray-150 p-5 rounded-2xl shadow-xs self-start lg:sticky lg:top-24">
          <div className="flex items-center gap-3 p-3 mb-6 rounded-xl bg-gray-50/80 border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-black uppercase text-sm select-none">
              {user?.displayName?.[0] || user?.email?.[0] || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.displayName || "Marketplace User"}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {items.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-black text-white"
                      : "text-gray-700 hover:bg-gray-50 hover:text-black"
                  )}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}

            {role === "customer" && (
              <Link
                href="/seller/register"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Store className="h-4.5 w-4.5 shrink-0" />
                <span>Become a Seller</span>
              </Link>
            )}

            <hr className="my-3 border-t border-gray-100" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5 shrink-0" />
              <span>Log Out</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="bg-white border border-gray-150 p-6 sm:p-8 rounded-2xl shadow-xs">
          {children}
        </main>
      </div>
    </div>
  );
}

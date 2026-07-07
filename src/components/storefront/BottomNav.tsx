"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, ShoppingBag, User, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/stores/cart";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { useUser } from "@/lib/hooks/useUser";

export default function BottomNav() {
  const pathname = usePathname();
  const cartItems = useCartStore((state) => state.items);
  const wishlistIds = useWishlistStore((state) => state.ids);
  const { isAuthenticated, role } = useUser();

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  // Hide on admin and seller panel pages
  if (
    pathname.startsWith("/seller") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  const accountHref =
    role === "admin"
      ? "/admin/dashboard"
      : role === "seller"
      ? "/seller/dashboard"
      : isAuthenticated
      ? "/profile"
      : "/login";

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Categories", href: "/products", icon: LayoutGrid },
    { label: "Wishlist", href: "/wishlist", icon: Heart, badge: wishlistIds.length },
    { label: "Bag", href: "/cart", icon: ShoppingBag, badge: totalCartCount },
    { label: "Account", href: accountHref, icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-ink-200 h-[60px] pb-safe shadow-lg flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 py-1 transition-colors relative"
          >
            <div className="relative">
              <Icon
                className={cn(
                  "h-6 w-6 stroke-[1.8] transition-all",
                  isActive ? "text-pink-500 scale-105" : "text-ink-500"
                )}
              />
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center border border-white">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span
              className={cn(
                "text-[9px] uppercase tracking-wider mt-1 transition-all",
                isActive ? "text-pink-500 font-bold" : "text-ink-400 font-medium"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

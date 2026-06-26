"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, ShoppingBag, User, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/stores/cart";
import { useWishlistStore } from "@/lib/stores/wishlist";

export default function BottomNav() {
  const pathname = usePathname();
  const cartItems = useCartStore((state) => state.items);
  const wishlistIds = useWishlistStore((state) => state.ids);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  // Hide on admin, seller, or dashboard pages
  if (
    pathname.startsWith("/seller") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard")
  ) {
    return null;
  }

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Shop", href: "/category/all", icon: LayoutGrid },
    { label: "Wishlist", href: "/wishlist", icon: Heart, badge: wishlistIds.length },
    { label: "Cart", href: "/cart", icon: ShoppingBag, badge: totalCartCount },
    { label: "Account", href: "/seller/dashboard", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-150 py-2 pb-safe shadow-lg flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-12 py-1 text-gray-500 hover:text-black transition-colors relative",
              isActive && "text-black font-semibold"
            )}
          >
            <div className="relative">
              <Icon className={cn("h-5.5 w-5.5 transition-transform duration-200", isActive ? "scale-105" : "")} />
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1.5 -right-2 bg-black text-white text-[9px] font-bold h-4.5 w-4.5 rounded-full flex items-center justify-center border border-white">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] mt-1 tracking-tight font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

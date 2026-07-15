"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  User as UserIcon,
  Menu,
  ChevronDown,
  LogOut,
  ArrowRight,
  Shield,
  ShoppingBag,
  Store,
  MoreVertical,
  Package,
  LayoutGrid,
} from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";
import { useCategories } from "@/lib/hooks/useCategories";
import { useCartStore } from "@/lib/stores/cart";
import { useWishlistStore } from "@/lib/stores/wishlist";
import CartDrawer from "./CartDrawer";
import SearchBar from "./SearchBar";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import toast from "react-hot-toast";
import { Logo } from "@/components/ui/myntra/Logo";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

// Promotional messages rotated in the top bar. Kept at module scope so the
// rotation effect has a stable reference (no exhaustive-deps warning) and the
// copy matches the app's real COD-only, per-store shipping policy.
const PROMO_MESSAGES = [
  "🇧🇩 CASH ON DELIVERY AVAILABLE ACROSS BANGLADESH",
  "💥 FIRST ORDER: FREE SHIPPING ON ELIGIBLE ITEMS",
  "✨ EID & PUJA COLLECTIONS NOW LIVE",
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useUser();
  const { data: categories = [] } = useCategories();
  const cartItems = useCartStore((state) => state.items);
  const wishlistIds = useWishlistStore((state) => state.ids);
  const setCartOpen = useCartStore((state) => state.setIsOpen);

  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [promoMessageIndex, setPromoMessageIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const promoMessages = PROMO_MESSAGES;

  useEffect(() => {
    const interval = setInterval(() => {
      setPromoMessageIndex((prev) => (prev + 1) % PROMO_MESSAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Group categories into parent-child structure
  const rootCategories = categories
    .filter((c: any) => !c.parent)
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  const getSubcategories = (parentSlug: string) =>
    categories
      .filter((c: any) => c.parent === parentSlug)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Successfully logged out!");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to log out");
    }
  };

  const handleMouseEnter = (slug: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMegaMenu(slug);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const userInitial = user?.displayName
    ? user.displayName[0].toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-ink-200 shadow-[0_1px_3px_rgba(40,44,63,0.08)]">
      {/* Top Banner Ribbon */}
      <div className="w-full bg-ink-900 text-white text-center py-1.5 px-4 text-[11px] font-bold tracking-widest flex items-center justify-center gap-1 min-h-[28px] overflow-hidden select-none">
        <motion.span
          key={promoMessageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {promoMessages[promoMessageIndex]}
        </motion.span>
      </div>

      {/* Main Navigation Row: [search] — [logo centered] — [wishlist][cart][more] */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 lg:h-20 flex items-center gap-3 lg:gap-6 lg:grid lg:grid-cols-3">
        {/* Mobile Hamburger Drawer (left) */}
        <div className="block lg:hidden">
          <Sheet>
            <SheetTrigger render={
              <button className="p-2 -ml-2 text-ink-700 hover:text-pink-500 transition-colors rounded-full hover:bg-ink-50 focus:outline-none">
                <Menu className="h-6 w-6" />
              </button>
            } />
            <SheetContent side="left" className="w-[300px] sm:w-[360px] p-0 flex flex-col bg-white">
              <SheetHeader className="px-6 pt-6 pb-4 border-b border-ink-200 text-left">
                <SheetTitle className="flex items-center justify-between">
                  <Logo className="h-7" />
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Navigation List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {/* Become a Seller CTA card */}
                <div className="bg-ink-50 border border-ink-200 rounded-md p-4 space-y-2">
                  <p className="text-xs font-bold text-pink-500 uppercase tracking-widest">AORGO MERCHANT</p>
                  <p className="text-sm font-bold text-ink-900">Start Selling on AORGO Today</p>
                  <p className="text-xs text-ink-500">Reach millions of fashion buyers across Bangladesh.</p>
                  <SheetClose render={
                    <Link
                      href="/seller/register"
                      className="inline-flex items-center justify-center w-full mt-2 h-9 text-xs font-bold bg-ink-900 text-white rounded-md hover:bg-ink-700 transition-colors"
                    >
                      BECOME A SELLER
                    </Link>
                  } />
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">SHOP CATEGORIES</p>
                  {rootCategories.map((parent: any) => {
                    const subs = getSubcategories(parent.slug);
                    return (
                      <div key={parent.slug} className="space-y-2">
                        <SheetClose render={
                          <Link
                            href={`/category/${parent.slug}`}
                            className="block text-base font-bold text-ink-900 hover:text-pink-500 transition-colors"
                          >
                            {parent.name.toUpperCase()}
                          </Link>
                        } />
                        {subs.length > 0 && (
                          <div className="pl-3 border-l border-ink-200 flex flex-col space-y-1.5">
                            {subs.map((sub: any) => (
                              <SheetClose key={sub.slug} render={
                                <Link
                                  href={`/category/${sub.slug}`}
                                  className="text-sm font-semibold text-ink-500 hover:text-pink-500 py-0.5 transition-colors"
                                >
                                  {sub.name}
                                </Link>
                              } />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Additional links */}
                <div className="pt-4 border-t border-ink-200 space-y-3 flex flex-col">
                  <SheetClose render={
                    <Link href="/products" className="text-sm font-bold text-ink-700 hover:text-pink-500 transition-colors">
                      BROWSE ALL PRODUCTS
                    </Link>
                  } />
                  <SheetClose render={
                    <Link href="/stores" className="flex items-center gap-2 text-sm font-bold text-ink-700 hover:text-pink-500 transition-colors">
                      <Store className="h-4 w-4" /> EXPLORE STORES
                    </Link>
                  } />
                  <SheetClose render={
                    <Link href="/wishlist" className="text-sm font-bold text-ink-700 hover:text-pink-500 transition-colors">
                      MY WISHLIST
                    </Link>
                  } />
                </div>
              </div>

              {/* Mobile Footer Auth Section */}
              <div className="p-6 border-t border-ink-200 bg-ink-50">
                {isAuthenticated && user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold text-sm">
                        {userInitial}
                      </div>
                      <div className="max-w-[140px]">
                        <p className="text-sm font-semibold truncate text-ink-900">{user.displayName || "User"}</p>
                        <p className="text-xs text-ink-400 capitalize">{user.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-ink-400 hover:text-pink-500 transition-colors rounded-full hover:bg-white"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <SheetClose render={
                    <Link
                      href={`/login?redirect=${encodeURIComponent(pathname)}`}
                      className="block w-full py-3 text-center bg-pink-500 text-white rounded-md font-bold hover:bg-pink-600 transition-colors text-xs tracking-wider"
                    >
                      LOG IN / SIGN UP
                    </Link>
                  } />
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* 1. Wide Search Bar (desktop, left cell) */}
        <SearchBar className="hidden lg:block w-full max-w-md lg:justify-self-start" />

        {/* 2. Logo + Brand Name (always perfectly centered) */}
        <Link
          href="/"
          className="flex items-center gap-1.5 sm:gap-2 shrink-0 mx-auto lg:mx-0 lg:justify-self-center"
        >
          <Logo className="h-8 sm:h-11" />
          <span className="block text-xl sm:text-2xl font-display font-black tracking-[0.15em] sm:tracking-widest text-ink-900 uppercase leading-none">
            AORGO
          </span>
        </Link>

        {/* Right Side Icons: Wishlist, Cart, More */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0 ml-auto lg:ml-0 lg:justify-self-end">
          {/* 3. Wishlist */}
          <Link
            href="/wishlist"
            className="flex flex-col items-center gap-0.5 text-ink-700 hover:text-pink-500 transition-colors"
            aria-label="Wishlist"
          >
            <span className="relative">
              <Heart className="h-5 w-5 stroke-[1.8]" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 bg-pink-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                  {wishlistIds.length}
                </span>
              )}
            </span>
            <span className="text-[11px] font-bold hidden lg:block">Wishlist</span>
          </Link>

          {/* 4. Cart Bag */}
          <button
            onClick={() => setCartOpen(true)}
            className="flex flex-col items-center gap-0.5 text-ink-700 hover:text-pink-500 transition-colors focus:outline-none cursor-pointer"
            aria-label="Shopping Bag"
          >
            <span className="relative">
              <ShoppingBag className="h-5 w-5 stroke-[1.8]" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 bg-pink-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                  {totalCartCount}
                </span>
              )}
            </span>
            <span className="text-[11px] font-bold hidden lg:block">Bag</span>
          </button>

          {/* 5. Three-dot (More) Menu — account + quick links */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button
                className="flex flex-col items-center gap-0.5 text-ink-700 hover:text-pink-500 transition-colors focus:outline-none cursor-pointer group"
                aria-label="More menu"
              >
                {isLoading ? (
                  <span className="w-5 h-5 rounded-full bg-ink-100 animate-pulse" />
                ) : isAuthenticated && user ? (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-ink-900 text-white group-hover:bg-pink-500 transition-colors font-bold text-[11px]">
                    {userInitial}
                  </span>
                ) : (
                  <MoreVertical className="h-5 w-5 stroke-[1.8]" />
                )}
                <span className="text-[11px] font-bold hidden lg:block">More</span>
              </button>
            } />
            <DropdownMenuContent align="end" className="w-60 bg-white border border-ink-200 shadow-lg rounded-md p-1.5">
              {isAuthenticated && user ? (
                <>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-2.5 py-2">
                      <p className="text-sm font-semibold text-ink-900 truncate">{user.displayName || "My Profile"}</p>
                      <p className="text-xs text-ink-400 truncate">{user.email}</p>
                      <p className="text-[9px] text-white font-bold uppercase tracking-wider bg-pink-500 rounded-sm w-fit px-2 py-0.5 mt-1.5">
                        {user.role}
                      </p>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-ink-200" />

                  <DropdownMenuItem render={
                    <Link href="/profile" className="flex items-center gap-2 text-ink-700 font-bold rounded-sm px-2.5 py-2 hover:bg-ink-50 focus:bg-ink-50 transition-colors w-full text-xs uppercase tracking-wider">
                      <UserIcon className="h-4 w-4 text-ink-400" />
                      <span>My Profile</span>
                    </Link>
                  } />
                  <DropdownMenuItem render={
                    <Link href="/orders" className="flex items-center gap-2 text-ink-700 font-bold rounded-sm px-2.5 py-2 hover:bg-ink-50 focus:bg-ink-50 transition-colors w-full text-xs uppercase tracking-wider">
                      <Package className="h-4 w-4 text-ink-400" />
                      <span>My Orders</span>
                    </Link>
                  } />

                  {user.role === "admin" && (
                    <DropdownMenuItem render={
                      <Link href="/admin/dashboard" className="flex items-center gap-2 text-ink-700 font-bold rounded-sm px-2.5 py-2 hover:bg-ink-50 focus:bg-ink-50 transition-colors w-full text-xs uppercase tracking-wider">
                        <Shield className="h-4 w-4 text-ink-400" />
                        <span>Admin Dashboard</span>
                      </Link>
                    } />
                  )}

                  {user.role === "seller" && (
                    <DropdownMenuItem render={
                      <Link href="/seller/dashboard" className="flex items-center gap-2 text-ink-700 font-bold rounded-sm px-2.5 py-2 hover:bg-ink-50 focus:bg-ink-50 transition-colors w-full text-xs uppercase tracking-wider">
                        <ShoppingBag className="h-4 w-4 text-ink-400" />
                        <span>Seller Dashboard</span>
                      </Link>
                    } />
                  )}

                  {user.role === "customer" && (
                    <DropdownMenuItem render={
                      <Link href="/seller/register" className="flex items-center gap-2 text-ink-700 font-bold rounded-sm px-2.5 py-2 hover:bg-ink-50 focus:bg-ink-50 transition-colors w-full text-xs uppercase tracking-wider">
                        <Store className="h-4 w-4 text-ink-400" />
                        <span>Become a Seller</span>
                      </Link>
                    } />
                  )}

                  <DropdownMenuSeparator className="bg-ink-200" />
                  <DropdownMenuItem render={
                    <Link href="/stores" className="flex items-center gap-2 text-ink-700 font-bold rounded-sm px-2.5 py-2 hover:bg-ink-50 focus:bg-ink-50 transition-colors w-full text-xs uppercase tracking-wider">
                      <LayoutGrid className="h-4 w-4 text-ink-400" />
                      <span>Explore Stores</span>
                    </Link>
                  } />

                  <DropdownMenuSeparator className="bg-ink-200" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="rounded-sm px-2.5 py-2 hover:bg-pink-50 focus:bg-pink-50 transition-colors text-pink-500 font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-pink-500" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem render={
                    <Link
                      href={`/login?redirect=${encodeURIComponent(pathname)}`}
                      className="flex items-center gap-2 text-ink-700 font-bold rounded-sm px-2.5 py-2 hover:bg-ink-50 focus:bg-ink-50 transition-colors w-full text-xs uppercase tracking-wider"
                    >
                      <UserIcon className="h-4 w-4 text-ink-400" />
                      <span>Log In / Sign Up</span>
                    </Link>
                  } />
                  <DropdownMenuSeparator className="bg-ink-200" />
                  <DropdownMenuItem render={
                    <Link href="/products" className="flex items-center gap-2 text-ink-700 font-bold rounded-sm px-2.5 py-2 hover:bg-ink-50 focus:bg-ink-50 transition-colors w-full text-xs uppercase tracking-wider">
                      <LayoutGrid className="h-4 w-4 text-ink-400" />
                      <span>All Products</span>
                    </Link>
                  } />
                  <DropdownMenuItem render={
                    <Link href="/stores" className="flex items-center gap-2 text-ink-700 font-bold rounded-sm px-2.5 py-2 hover:bg-ink-50 focus:bg-ink-50 transition-colors w-full text-xs uppercase tracking-wider">
                      <Store className="h-4 w-4 text-ink-400" />
                      <span>Explore Stores</span>
                    </Link>
                  } />
                  <DropdownMenuItem render={
                    <Link href="/seller/register" className="flex items-center gap-2 text-ink-700 font-bold rounded-sm px-2.5 py-2 hover:bg-ink-50 focus:bg-ink-50 transition-colors w-full text-xs uppercase tracking-wider">
                      <ShoppingBag className="h-4 w-4 text-ink-400" />
                      <span>Become a Seller</span>
                    </Link>
                  } />
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Persistent Search Bar Row */}
      <div className="lg:hidden px-4 pb-3">
        <SearchBar className="w-full" />
      </div>

      {/* Secondary Navigation Row: Women / Men / … + Stores (desktop) */}
      <nav className="hidden lg:block border-t border-ink-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-7 xl:gap-9 h-12">
          {rootCategories.map((parent: any) => {
            const subs = getSubcategories(parent.slug);
            const isMenuOpen = activeMegaMenu === parent.slug;

            return (
              <div
                key={parent.slug}
                className="relative flex items-center h-full"
                onMouseEnter={() => handleMouseEnter(parent.slug)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={`/category/${parent.slug}`}
                  className={cn(
                    "flex items-center gap-1 text-[13px] font-bold tracking-wider text-ink-700 hover:text-pink-500 border-b-2 border-transparent hover:border-pink-500 h-full transition-all duration-150 uppercase",
                    isMenuOpen && "text-pink-500 border-pink-500"
                  )}
                >
                  {parent.name}
                  {subs.length > 0 && <ChevronDown className="h-3.5 w-3.5" />}
                </Link>

                {/* Animated Dropdown Mega-Menu Panel */}
                <AnimatePresence>
                  {isMenuOpen && subs.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="absolute left-0 top-full w-[600px] bg-white rounded-md shadow-lg border border-ink-200 p-6 grid grid-cols-12 gap-6 z-50"
                    >
                      {/* Left: Subcategory list */}
                      <div className="col-span-8 grid grid-cols-2 gap-4 border-r border-ink-200 pr-4">
                        <div className="col-span-2">
                          <h4 className="text-xs font-bold text-ink-400 uppercase tracking-widest mb-1">
                            Browse {parent.name}
                          </h4>
                        </div>
                        {subs.map((sub: any) => (
                          <Link
                            key={sub.slug}
                            href={`/category/${sub.slug}`}
                            onClick={() => setActiveMegaMenu(null)}
                            className="group flex items-center justify-between p-2 rounded-sm hover:bg-ink-50 transition-colors"
                          >
                            <span className="text-sm font-bold text-ink-700 group-hover:text-pink-500 transition-colors">
                              {sub.name}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-pink-500" />
                          </Link>
                        ))}
                      </div>

                      {/* Right: Promotional Visual Section */}
                      <div className="col-span-4 flex flex-col justify-between bg-ink-50 rounded-sm p-4 overflow-hidden relative">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-white bg-pink-500 py-0.5 px-2 rounded-full uppercase tracking-wider">
                            Trending Now
                          </span>
                          <h3 className="text-sm font-bold text-ink-900 pt-2 leading-snug">
                            {parent.name.toUpperCase()} EDITS
                          </h3>
                          <p className="text-xs text-ink-500 leading-normal">
                            Explore the most premium local collections.
                          </p>
                        </div>

                        <Link
                          href={`/category/${parent.slug}`}
                          onClick={() => setActiveMegaMenu(null)}
                          className="flex items-center gap-1.5 text-xs font-bold text-pink-500 group mt-4 hover:underline"
                        >
                          <span>Shop Collection</span>
                          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Static directory links */}
          <Link
            href="/products"
            className={cn(
              "text-[13px] font-bold tracking-wider text-ink-700 hover:text-pink-500 border-b-2 border-transparent hover:border-pink-500 h-full flex items-center transition-all duration-150 uppercase",
              pathname === "/products" && "text-pink-500 border-pink-500"
            )}
          >
            All Products
          </Link>
          <Link
            href="/stores"
            className={cn(
              "flex items-center gap-1.5 text-[13px] font-bold tracking-wider text-ink-700 hover:text-pink-500 border-b-2 border-transparent hover:border-pink-500 h-full transition-all duration-150 uppercase",
              pathname.startsWith("/stores") && "text-pink-500 border-pink-500"
            )}
          >
            <Store className="h-4 w-4" />
            Stores
          </Link>
        </div>
      </nav>

      <CartDrawer />
    </header>
  );
}

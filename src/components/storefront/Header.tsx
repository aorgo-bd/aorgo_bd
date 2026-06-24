"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  LogOut,
  SlidersHorizontal,
  ArrowRight,
  Shield,
  ShoppingBag,
} from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";
import { useCategories } from "@/lib/hooks/useCategories";
import { useCartStore } from "@/lib/stores/cart";
import { useWishlistStore } from "@/lib/stores/wishlist";
import CartDrawer from "./CartDrawer";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useUser();
  const { data: categories = [], isLoading: isLoadingCats } = useCategories();
  const cartItems = useCartStore((state) => state.items);
  const wishlistIds = useWishlistStore((state) => state.ids);
  const setCartOpen = useCartStore((state) => state.setIsOpen);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Group categories into parent-child structure
  const rootCategories = categories.filter((c: any) => !c.parent);
  const getSubcategories = (parentSlug: string) =>
    categories.filter((c: any) => c.parent === parentSlug);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileSearchOpen(false);
    }
  };

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

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      {/* Top Banner Ribbon */}
      <div className="w-full bg-black text-white text-center py-2 px-4 text-xs font-light tracking-wide flex items-center justify-center gap-1">
        <span>Sign up and get 20% off your first order.</span>
        {!isAuthenticated && (
          <Link href="/register" className="font-semibold underline hover:text-gray-200 transition-colors">
            Sign Up Now
          </Link>
        )}
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Left Side: Mobile Menu Drawer + Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburg Drawer */}
          <div className="block lg:hidden">
            <Sheet>
              <SheetTrigger render={
                <button className="p-2 -ml-2 text-gray-700 hover:text-black transition-colors rounded-full hover:bg-gray-50 focus:outline-none">
                  <Menu className="h-6 w-6" />
                </button>
              } />
              <SheetContent side="left" className="w-[300px] sm:w-[360px] p-0 flex flex-col bg-white">
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100 text-left">
                  <SheetTitle className="text-2xl font-bold tracking-tight text-black">
                    AORGO
                  </SheetTitle>
                </SheetHeader>
                
                {/* Mobile Navigation List */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  {rootCategories.map((parent: any) => {
                    const subs = getSubcategories(parent.slug);
                    return (
                      <div key={parent.slug} className="space-y-3">
                        <SheetClose render={
                          <Link
                            href={`/category/${parent.slug}`}
                            className="block text-lg font-bold text-gray-900 hover:text-black"
                          >
                            {parent.name}
                          </Link>
                        } />
                        {subs.length > 0 && (
                          <div className="pl-4 space-y-2 border-l border-gray-100 flex flex-col">
                            {subs.map((sub: any) => (
                              <SheetClose key={sub.slug} render={
                                <Link
                                  href={`/category/${sub.slug}`}
                                  className="text-sm font-medium text-gray-500 hover:text-black py-1"
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
                  
                  {/* Additional links */}
                  <div className="pt-4 border-t border-gray-100 space-y-3 flex flex-col">
                    <SheetClose render={
                      <Link href="/products" className="text-base font-medium text-gray-700 hover:text-black">
                        Browse All Products
                      </Link>
                    } />
                    <SheetClose render={
                      <Link href="/wishlist" className="text-base font-medium text-gray-700 hover:text-black">
                        My Wishlist
                      </Link>
                    } />
                  </div>
                </div>

                {/* Mobile Footer Auth Section */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  {isAuthenticated && user ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                          {user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : "U")}
                        </div>
                        <div className="max-w-[140px]">
                          <p className="text-sm font-semibold truncate text-gray-900">{user.displayName || "User"}</p>
                          <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-gray-100"
                      >
                        <LogOut className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <SheetClose render={
                      <Link
                        href="/login"
                        className="block w-full py-3 text-center bg-black text-white rounded-full font-semibold hover:bg-black/90 transition-colors text-sm"
                      >
                        Log In / Register
                      </Link>
                    } />
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <Link
            href="/"
            className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-black transition-opacity hover:opacity-90"
          >
            AORGO.
          </Link>
        </div>

        {/* Center: Desktop Mega-Menu Categories */}
        <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
          {rootCategories.map((parent: any) => {
            const subs = getSubcategories(parent.slug);
            const isMenuOpen = activeMegaMenu === parent.slug;

            return (
              <div
                key={parent.slug}
                className="relative py-6"
                onMouseEnter={() => handleMouseEnter(parent.slug)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={`/category/${parent.slug}`}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black transition-colors"
                >
                  {parent.name}
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`} />
                </Link>

                {/* Animated Dropdown Mega-Menu Panel */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-1/2 -translate-x-1/2 top-full w-[540px] xl:w-[620px] bg-white rounded-2xl shadow-xl border border-gray-100 p-6 grid grid-cols-12 gap-6"
                    >
                      {/* Left: Subcategory list */}
                      <div className="col-span-7 grid grid-cols-2 gap-4 border-r border-gray-100 pr-4">
                        <div className="col-span-2">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                            Browse by Type
                          </h4>
                        </div>
                        {subs.map((sub: any) => (
                          <Link
                            key={sub.slug}
                            href={`/category/${sub.slug}`}
                            onClick={() => setActiveMegaMenu(null)}
                            className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-sm font-semibold text-gray-800 group-hover:text-black transition-colors">
                              {sub.name}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-black" />
                          </Link>
                        ))}
                      </div>

                      {/* Right: Promotional Visual Section */}
                      <div className="col-span-5 flex flex-col justify-between bg-gray-50 rounded-xl p-4 overflow-hidden relative">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 py-1 px-2 rounded-full uppercase tracking-wider">
                            New Season
                          </span>
                          <h3 className="text-base font-bold text-gray-900 pt-2 leading-snug">
                            {parent.name} Essentials
                          </h3>
                          <p className="text-xs text-gray-500 leading-normal">
                            Discover carefully curated fashion edits.
                          </p>
                        </div>
                        
                        <Link
                          href={`/category/${parent.slug}`}
                          onClick={() => setActiveMegaMenu(null)}
                          className="flex items-center gap-1.5 text-xs font-bold text-black group mt-4"
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
        </nav>

        {/* Desktop Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-sm lg:max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="search"
            placeholder="Search for products, brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-transparent rounded-full focus:outline-none focus:bg-white focus:border-black transition-all duration-200"
          />
        </form>

        {/* Right Side Icons: Search, Wishlist, Cart, Profile */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {/* Mobile Search Trigger */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="p-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-full transition-colors md:hidden"
          >
            <Search className="h-5.5 w-5.5" />
          </button>

          {/* Wishlist Icon */}
          <Link
            href="/wishlist"
            className="p-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-full transition-colors relative group"
          >
            <Heart className="h-5.5 w-5.5 group-hover:scale-105 transition-transform" />
            {wishlistIds.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 text-[9px] font-bold text-white bg-black rounded-full flex items-center justify-center animate-scale-in">
                {wishlistIds.length}
              </span>
            )}
          </Link>

          {/* Cart Icon */}
          <button
            onClick={() => setCartOpen(true)}
            className="p-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-full transition-colors relative group focus:outline-none cursor-pointer"
          >
            <ShoppingCart className="h-5.5 w-5.5 group-hover:scale-105 transition-transform" />
            {totalCartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 text-[9px] font-bold text-white bg-black rounded-full flex items-center justify-center animate-scale-in">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown Menu */}
          <div className="flex items-center">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <button className="flex items-center justify-center w-9 h-9 rounded-full bg-black text-white hover:bg-black/90 transition-colors font-bold text-sm focus:outline-none">
                    {user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : "U")}
                  </button>
                } />
                <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-100 shadow-xl rounded-xl p-1.5">
                  <DropdownMenuLabel className="px-2.5 py-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName || "My Profile"}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    <p className="text-[10px] text-black font-semibold uppercase tracking-wider bg-gray-100 rounded-full w-fit px-2 py-0.5 mt-1">
                      {user.role}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  
                  <DropdownMenuItem render={
                    <Link href="/profile" className="flex items-center gap-2 text-gray-700 font-medium rounded-lg px-2.5 py-2 hover:bg-gray-50 focus:bg-gray-50 transition-colors w-full">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <span>My Profile</span>
                    </Link>
                  } />

                  {user.role === "admin" && (
                    <DropdownMenuItem render={
                      <Link href="/dashboard" className="flex items-center gap-2 text-gray-700 font-medium rounded-lg px-2.5 py-2 hover:bg-gray-50 focus:bg-gray-50 transition-colors w-full">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <span>Admin Dashboard</span>
                      </Link>
                    } />
                  )}

                  {user.role === "seller" && (
                    <DropdownMenuItem render={
                      <Link href="/seller" className="flex items-center gap-2 text-gray-700 font-medium rounded-lg px-2.5 py-2 hover:bg-gray-50 focus:bg-gray-50 transition-colors w-full">
                        <ShoppingBag className="h-4 w-4 text-gray-500" />
                        <span>Seller Dashboard</span>
                      </Link>
                    } />
                  )}

                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="rounded-lg px-2.5 py-2 hover:bg-red-50 focus:bg-red-50 transition-colors text-red-600 font-medium"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center justify-center px-5 py-2 text-sm font-semibold bg-black hover:bg-black/90 text-white rounded-full transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Expanding Search Overlay */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full bg-white border-b border-gray-100 md:hidden overflow-hidden"
          >
            <form onSubmit={handleSearchSubmit} className="p-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-full focus:outline-none focus:bg-white focus:border-black text-sm"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="px-3 text-sm font-semibold text-gray-600 hover:text-black"
              >
                Cancel
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <CartDrawer />
    </header>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import { toast } from "sonner";
import { Logo } from "@/components/ui/myntra/Logo";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      toast.success("Successfully subscribed to the newsletter!");
      setEmail("");
    }
  };

  return (
    <footer className="w-full bg-[#1A1A1A] text-white mt-16 pt-24 sm:pt-32 relative border-t border-ink-900">
      
      {/* Floating Newsletter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 absolute -top-16 sm:-top-20 left-0 right-0 z-10">
        <div className="bg-gradient-to-r from-pink-500 to-brand-orange rounded-md p-6 sm:p-10 lg:py-8 lg:px-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8 shadow-xl">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-white tracking-wider max-w-[580px] uppercase">
            Stay Updated with Our Latest Offers
          </h2>
          
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-[460px]">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
              <input
                type="email"
                placeholder="Enter your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white text-ink-900 text-xs font-semibold rounded-sm focus:outline-none placeholder:text-ink-400"
              />
            </div>
            <button
              type="submit"
              className="bg-ink-900 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-6 rounded-sm hover:bg-ink-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>Subscribe</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-ink-900">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Column 1: Online Shopping */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">
              Online Shopping
            </h3>
            <ul className="space-y-2 flex flex-col">
              <li>
                <Link href="/category/women" className="text-xs font-semibold text-ink-400 hover:text-pink-500 transition-colors uppercase">
                  Women&apos;s Wear
                </Link>
              </li>
              <li>
                <Link href="/category/men" className="text-xs font-semibold text-ink-400 hover:text-pink-500 transition-colors uppercase">
                  Men&apos;s Wear
                </Link>
              </li>
              <li>
                <Link href="/category/kids" className="text-xs font-semibold text-ink-400 hover:text-pink-500 transition-colors uppercase">
                  Kids&apos; Collection
                </Link>
              </li>
              <li>
                <Link href="/category/footwear" className="text-xs font-semibold text-ink-400 hover:text-pink-500 transition-colors uppercase">
                  Footwear & Shoes
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-xs font-semibold text-ink-400 hover:text-pink-500 transition-colors uppercase">
                  Browse Catalog
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Customer Policies */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">
              Customer Policies
            </h3>
            <ul className="space-y-2 flex flex-col">
              <li>
                <Link href="/support" className="text-xs font-semibold text-ink-400 hover:text-pink-500 transition-colors uppercase">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-xs font-semibold text-ink-400 hover:text-pink-500 transition-colors uppercase">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-xs font-semibold text-ink-400 hover:text-pink-500 transition-colors uppercase">
                  T&C
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-xs font-semibold text-ink-400 hover:text-pink-500 transition-colors uppercase">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-xs font-semibold text-ink-400 hover:text-pink-500 transition-colors uppercase">
                  Track Orders & Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Experience Aorgo App */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">
              Experience Aorgo App
            </h3>
            <p className="text-xs text-ink-400 leading-relaxed font-semibold">
              Shop on the go directly from your mobile browser. Our premium interface is designed to load instantly.
            </p>
            <div className="flex flex-col gap-2 pt-1.5">
              <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">100% Original Guarantee</span>
              <p className="text-[11px] text-ink-500">For all products sold on Aorgo Marketplace</p>
            </div>
          </div>

          {/* Column 4: Keep In Touch */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">
              Keep In Touch
            </h3>
            {/* Socials */}
            <div className="flex items-center space-x-3">
              <Link href="https://facebook.com" className="w-8 h-8 rounded-sm bg-ink-900 hover:bg-pink-500 hover:text-white flex items-center justify-center p-1.5 transition-all text-ink-300">
                <FaFacebookF className="h-4 w-4" />
              </Link>
              <Link href="https://instagram.com" className="w-8 h-8 rounded-sm bg-ink-900 hover:bg-pink-500 hover:text-white flex items-center justify-center p-1.5 transition-all text-ink-300">
                <FaInstagram className="h-4 w-4" />
              </Link>
              <Link href="https://twitter.com" className="w-8 h-8 rounded-sm bg-ink-900 hover:bg-pink-500 hover:text-white flex items-center justify-center p-1.5 transition-all text-ink-300">
                <FaTwitter className="h-4 w-4" />
              </Link>
              <Link href="https://youtube.com" className="w-8 h-8 rounded-sm bg-ink-900 hover:bg-pink-500 hover:text-white flex items-center justify-center p-1.5 transition-all text-ink-300">
                <FaYoutube className="h-4 w-4" />
              </Link>
            </div>
            <div className="pt-2">
              <Logo className="h-7 opacity-80" />
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar: Copyright & Payment Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-ink-500 text-center sm:text-left font-semibold">
          AORGO. © 2026. All Rights Reserved. Designed to WOW.
        </p>
        
        {/* BD Trust Payment Badges */}
        <div className="flex items-center space-x-2.5 flex-wrap justify-center">
          <span className="h-[28px] px-2 rounded-sm border border-ink-900 bg-[#2C2C2C] flex items-center justify-center select-none shadow-2xs font-extrabold text-[10px] tracking-tighter text-white uppercase">
            COD Available
          </span>
          <span className="w-[42px] h-[28px] rounded-sm border border-ink-900 bg-[#E2125B] flex items-center justify-center shadow-2xs text-white font-bold text-[9px] uppercase">
            bKash
          </span>
          <span className="w-[42px] h-[28px] rounded-sm border border-ink-900 bg-[#F27224] flex items-center justify-center shadow-2xs text-white font-bold text-[9px] uppercase">
            Nagad
          </span>
          <span className="w-[42px] h-[28px] rounded-sm border border-ink-900 bg-white flex items-center justify-center shadow-2xs text-[#1A1F71] font-bold text-[10px] italic">
            VISA
          </span>
          <span className="w-[42px] h-[28px] rounded-sm border border-ink-900 bg-white flex items-center justify-center shadow-2xs text-[#FF5F00] font-bold text-[10px]">
            MC
          </span>
        </div>
      </div>
    </footer>
  );
}

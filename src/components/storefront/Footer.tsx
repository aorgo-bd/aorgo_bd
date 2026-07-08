"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import toast from "react-hot-toast";
import { Logo } from "@/components/ui/myntra/Logo";

const FOOTER_LINK =
  "text-xs font-semibold text-ink-500 hover:text-pink-500 transition-colors";
const FOOTER_HEADING =
  "text-[11px] font-bold text-ink-400 uppercase tracking-widest mb-4";

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
    <footer className="w-full bg-white border-t border-ink-200 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Online Shopping */}
          <div>
            <h3 className={FOOTER_HEADING}>Online Shopping</h3>
            <ul className="space-y-2.5 flex flex-col">
              <li><Link href="/category/women" className={FOOTER_LINK}>Women</Link></li>
              <li><Link href="/category/men" className={FOOTER_LINK}>Men</Link></li>
              <li><Link href="/category/kids" className={FOOTER_LINK}>Kids</Link></li>
              <li><Link href="/category/footwear" className={FOOTER_LINK}>Footwear</Link></li>
              <li><Link href="/products" className={FOOTER_LINK}>Browse Catalog</Link></li>
              <li><Link href="/stores" className={FOOTER_LINK}>Stores</Link></li>
            </ul>
          </div>

          {/* Column 2: Customer Policies */}
          <div>
            <h3 className={FOOTER_HEADING}>Customer Policies</h3>
            <ul className="space-y-2.5 flex flex-col">
              <li><Link href="/support" className={FOOTER_LINK}>Contact Us</Link></li>
              <li><Link href="/faq" className={FOOTER_LINK}>FAQ</Link></li>
              <li><Link href="/terms" className={FOOTER_LINK}>Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy" className={FOOTER_LINK}>Privacy Policy</Link></li>
              <li><Link href="/returns" className={FOOTER_LINK}>Track Orders &amp; Returns</Link></li>
            </ul>
          </div>

          {/* Column 3: Newsletter */}
          <div>
            <h3 className={FOOTER_HEADING}>Keep Up To Date</h3>
            <p className="text-xs text-ink-500 leading-relaxed mb-3">
              Subscribe for the latest drops, offers and style edits — straight to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="flex">
              <input
                type="email"
                placeholder="Enter email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 min-w-0 h-9 px-3 bg-ink-100 border border-ink-200 border-r-0 text-xs font-semibold text-ink-700 rounded-l-sm focus:outline-none focus:border-ink-300 placeholder:text-ink-400"
              />
              <button
                type="submit"
                className="h-9 px-4 bg-ink-900 text-white text-xs font-bold uppercase tracking-wider rounded-r-sm hover:bg-pink-500 transition-colors"
              >
                Join
              </button>
            </form>
          </div>

          {/* Column 4: Experience + Socials */}
          <div>
            <h3 className={FOOTER_HEADING}>Keep In Touch</h3>
            <div className="flex items-center space-x-3 mb-5">
              <Link href="https://facebook.com" aria-label="Facebook" className="w-8 h-8 rounded-full border border-ink-200 text-ink-500 hover:text-white hover:bg-pink-500 hover:border-pink-500 flex items-center justify-center transition-all">
                <FaFacebookF className="h-3.5 w-3.5" />
              </Link>
              <Link href="https://instagram.com" aria-label="Instagram" className="w-8 h-8 rounded-full border border-ink-200 text-ink-500 hover:text-white hover:bg-pink-500 hover:border-pink-500 flex items-center justify-center transition-all">
                <FaInstagram className="h-3.5 w-3.5" />
              </Link>
              <Link href="https://twitter.com" aria-label="Twitter" className="w-8 h-8 rounded-full border border-ink-200 text-ink-500 hover:text-white hover:bg-pink-500 hover:border-pink-500 flex items-center justify-center transition-all">
                <FaTwitter className="h-3.5 w-3.5" />
              </Link>
              <Link href="https://youtube.com" aria-label="YouTube" className="w-8 h-8 rounded-full border border-ink-200 text-ink-500 hover:text-white hover:bg-pink-500 hover:border-pink-500 flex items-center justify-center transition-all">
                <FaYoutube className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-brand-green text-lg leading-none">✓</span>
              <div>
                <p className="text-[11px] font-bold text-ink-700 uppercase tracking-wider">100% Original Guarantee</p>
                <p className="text-[11px] text-ink-400">For all products on AORGO Marketplace</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-ink-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="h-7" />
            <p className="text-xs text-ink-400 font-semibold">
              © 2026 AORGO. All Rights Reserved.
            </p>
          </div>

          {/* Payment Badges */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="h-[26px] px-2 rounded-sm border border-ink-200 bg-white flex items-center justify-center select-none font-bold text-[10px] tracking-tight text-ink-700 uppercase">
              COD
            </span>
            <span className="w-[42px] h-[26px] rounded-sm border border-ink-200 bg-[#E2136E] flex items-center justify-center text-white font-bold text-[9px]">
              bKash
            </span>
            <span className="w-[42px] h-[26px] rounded-sm border border-ink-200 bg-[#F7941D] flex items-center justify-center text-white font-bold text-[9px]">
              Nagad
            </span>
            <span className="w-[42px] h-[26px] rounded-sm border border-ink-200 bg-white flex items-center justify-center text-[#1A1F71] font-bold text-[10px] italic">
              VISA
            </span>
            <span className="w-[42px] h-[26px] rounded-sm border border-ink-200 bg-white flex items-center justify-center text-[#FF5F00] font-bold text-[10px]">
              MC
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

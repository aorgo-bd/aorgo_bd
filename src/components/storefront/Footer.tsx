"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import { toast } from "sonner";

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
    <footer className="w-full bg-[#F0F0F0] mt-16 pt-24 sm:pt-32 relative">
      
      {/* Floating Newsletter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 absolute -top-16 sm:-top-20 left-0 right-0 z-10">
        <div className="bg-black rounded-3xl p-6 sm:p-10 lg:py-9 lg:px-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8 shadow-xl">
          <h2 className="text-2xl sm:text-3xl lg:text-[40px] lg:leading-[40px] font-extrabold text-white tracking-tighter max-w-[580px]">
            STAY UP TO DATE ABOUT OUR LATEST OFFERS
          </h2>
          
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-[460px]">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="Enter your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white text-black text-sm rounded-full focus:outline-none placeholder:text-gray-400"
              />
            </div>
            <button
              type="submit"
              className="bg-white text-black text-sm font-semibold py-3 px-6 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <span>Subscribe</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 border-b border-black/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand Col */}
          <div className="lg:col-span-4 flex flex-col space-y-5">
            <h1 className="text-3xl font-black tracking-tighter text-black">
              AORGO.
            </h1>
            <p className="text-sm text-black/60 leading-relaxed max-w-[270px]">
              Discover BDT curated collections tailored for your everyday style. Crafted to bring out your individuality.
            </p>
            {/* Socials */}
            <div className="flex items-center space-x-3">
              <Link href="https://facebook.com" className="w-8 h-8 rounded-full border border-black/15 bg-white text-black hover:bg-black hover:text-white hover:border-black flex items-center justify-center p-1.5 transition-all">
                <FaFacebookF className="h-4 w-4" />
              </Link>
              <Link href="https://instagram.com" className="w-8 h-8 rounded-full border border-black/15 bg-white text-black hover:bg-black hover:text-white hover:border-black flex items-center justify-center p-1.5 transition-all">
                <FaInstagram className="h-4 w-4" />
              </Link>
              <Link href="https://twitter.com" className="w-8 h-8 rounded-full border border-black/15 bg-white text-black hover:bg-black hover:text-white hover:border-black flex items-center justify-center p-1.5 transition-all">
                <FaTwitter className="h-4 w-4" />
              </Link>
              <Link href="https://youtube.com" className="w-8 h-8 rounded-full border border-black/15 bg-white text-black hover:bg-black hover:text-white hover:border-black flex items-center justify-center p-1.5 transition-all">
                <FaYoutube className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="lg:col-span-2 flex flex-col space-y-4">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">
              Company
            </h3>
            <ul className="space-y-2.5 flex flex-col">
              <li>
                <Link href="/about" className="text-sm text-black/60 hover:text-black transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-sm text-black/60 hover:text-black transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/works" className="text-sm text-black/60 hover:text-black transition-colors">
                  Works
                </Link>
              </li>
              <li>
                <Link href="/career" className="text-sm text-black/60 hover:text-black transition-colors">
                  Career
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="lg:col-span-2 flex flex-col space-y-4">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">
              Help
            </h3>
            <ul className="space-y-2.5 flex flex-col">
              <li>
                <Link href="/support" className="text-sm text-black/60 hover:text-black transition-colors">
                  Customer Support
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="text-sm text-black/60 hover:text-black transition-colors">
                  Delivery Details
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-black/60 hover:text-black transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-black/60 hover:text-black transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="lg:col-span-2 flex flex-col space-y-4">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">
              FAQ
            </h3>
            <ul className="space-y-2.5 flex flex-col">
              <li>
                <Link href="/account" className="text-sm text-black/60 hover:text-black transition-colors">
                  Manage Account
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-sm text-black/60 hover:text-black transition-colors">
                  Orders & Returns
                </Link>
              </li>
              <li>
                <Link href="/payments" className="text-sm text-black/60 hover:text-black transition-colors">
                  Payments
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm text-black/60 hover:text-black transition-colors">
                  Shipping Rates
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 4 */}
          <div className="lg:col-span-2 flex flex-col space-y-4">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">
              Resources
            </h3>
            <ul className="space-y-2.5 flex flex-col">
              <li>
                <Link href="/blog" className="text-sm text-black/60 hover:text-black transition-colors">
                  Free eBooks
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-black/60 hover:text-black transition-colors">
                  Development Tutorial
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-black/60 hover:text-black transition-colors">
                  How-to Blog
                </Link>
              </li>
              <li>
                <Link href="/youtube" className="text-sm text-black/60 hover:text-black transition-colors">
                  Youtube Playlist
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar: Copyright & Payment Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-black/40 text-center sm:text-left">
          AORGO. © 2026. All Rights Reserved. Designed to WOW.
        </p>
        
        {/* BD Trust Payment Badges */}
        <div className="flex items-center space-x-2.5 flex-wrap justify-center">
          {/* COD (Cash on Delivery) Badge */}
          <span className="h-[28px] px-2 rounded-[4px] border border-gray-200 bg-white flex items-center justify-center select-none shadow-2xs font-extrabold text-[10px] tracking-tighter text-black uppercase">
            Cash On Delivery
          </span>

          {/* bKash SVG Logo */}
          <span className="w-[42px] h-[28px] rounded-[4px] border border-gray-200 bg-[#E2125B] flex items-center justify-center shadow-2xs text-white font-bold text-[9px] uppercase">
            bKash
          </span>

          {/* Nagad SVG Logo */}
          <span className="w-[42px] h-[28px] rounded-[4px] border border-gray-200 bg-[#F27224] flex items-center justify-center shadow-2xs text-white font-bold text-[9px] uppercase">
            Nagad
          </span>

          {/* Visa SVG Logo */}
          <span className="w-[42px] h-[28px] rounded-[4px] border border-gray-200 bg-white flex items-center justify-center shadow-2xs text-[#1A1F71] font-bold text-[10px] italic">
            VISA
          </span>

          {/* Mastercard SVG Logo */}
          <span className="w-[42px] h-[28px] rounded-[4px] border border-gray-200 bg-white flex items-center justify-center shadow-2xs text-[#FF5F00] font-bold text-[10px]">
            MC
          </span>
        </div>
      </div>
    </footer>
  );
}

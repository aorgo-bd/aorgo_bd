"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { useProductSuggestions } from "@/lib/hooks/useProductSearch";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import { Product } from "@/lib/types";
import { formatBDT } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
  onSearchExecuted?: () => void;
}

export default function SearchBar({ className = "", onSearchExecuted }: SearchBarProps) {
  const router = useRouter();
  const [queryVal, setQueryVal] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(queryVal);
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [queryVal]);

  const { data: suggestions = [], isLoading } = useProductSuggestions(debouncedQuery);

  // Close suggestions dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(queryVal.trim())}`);
      setIsOpen(false);
      onSearchExecuted?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > -1 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
        e.preventDefault();
        const selected = suggestions[focusedIndex];
        router.push(`/product/${selected.slug}`);
        setIsOpen(false);
        onSearchExecuted?.();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-pink-500 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-pink-500" />
          )}
        </div>
        <input
          type="search"
          placeholder="Search for brands, products & styles"
          value={queryVal}
          onChange={(e) => {
            setQueryVal(e.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full h-12 pl-12 pr-4 text-sm font-medium text-ink-900 placeholder:text-ink-400 bg-ink-100 border border-transparent rounded-2xl shadow-[0_2px_10px_rgba(40,44,63,0.06)] focus:outline-none focus:bg-white focus:border-pink-300 focus:shadow-[0_4px_18px_rgba(255,63,108,0.12)] transition-all duration-200"
        />
      </form>

      <AnimatePresence>
        {isOpen && queryVal.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 max-h-[350px] overflow-y-auto"
          >
            {suggestions.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500 font-medium">
                {isLoading ? "Loading recommendations..." : "No suggestions found."}
              </div>
            ) : (
              <div className="flex flex-col space-y-1">
                {suggestions.map((item: Product, index: number) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      router.push(`/product/${item.slug}`);
                      setIsOpen(false);
                      onSearchExecuted?.();
                    }}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`flex items-center gap-3 p-2 rounded-xl text-left w-full transition-colors ${
                      index === focusedIndex ? "bg-gray-50" : "bg-transparent"
                    }`}
                  >
                    <div className="relative w-10 h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                      {item.images?.[0] ? (
                        <CldImage
                          src={item.images[0]}
                          alt={item.title}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-400 capitalize truncate font-medium">
                        {item.brand} • {item.category.replace(/-/g, " ")}
                      </p>
                    </div>
                    <div className="text-sm font-extrabold text-black shrink-0">
                      {formatBDT(item.price)}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {queryVal.trim().length > 0 && suggestions.length > 0 && (
              <div className="border-t border-gray-100 mt-2 pt-2 px-2 flex justify-between items-center text-[10px] font-bold text-gray-450">
                <span>Use ↑↓ arrows to navigate</span>
                <Link
                  href={`/search?q=${encodeURIComponent(queryVal.trim())}`}
                  onClick={() => {
                    setIsOpen(false);
                    onSearchExecuted?.();
                  }}
                  className="text-black hover:underline"
                >
                  View all results
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

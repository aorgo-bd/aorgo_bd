"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBanners } from "@/lib/hooks/useBanners";
import { CldImage } from "next-cloudinary";
import type { Banner } from "@/lib/types";

// Fallback hero slides used only when no admin banners exist yet. These are
// pure image banners — the entire slide is a single clickable link with no
// overlaid copy or CTA button (spec #9). Admins upload full-bleed artwork
// (headline baked into the image) from Admin → Banners.
const FALLBACK_BANNERS: Banner[] = [
  {
    id: "fallback-1",
    title: "New season fashion",
    subtitle: "",
    imagePublicId: "/banner-fallback-1.jpg",
    ctaUrl: "/products",
    position: "hero",
    active: true,
    order: 1,
  },
  {
    id: "fallback-2",
    title: "Ethnic wear edit",
    subtitle: "",
    imagePublicId: "/banner-fallback-2.jpg",
    ctaUrl: "/category/women",
    position: "hero",
    active: true,
    order: 2,
  },
  {
    id: "fallback-3",
    title: "Footwear drop",
    subtitle: "",
    imagePublicId: "/banner-fallback-3.jpg",
    ctaUrl: "/category/footwear",
    position: "hero",
    active: true,
    order: 3,
  },
];

interface HeroCarouselProps {
  initialBanners?: Banner[];
}

export default function HeroCarousel({ initialBanners }: HeroCarouselProps) {
  const { data: dbBanners = [], isLoading } = useBanners("hero", initialBanners);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const banners: Banner[] = dbBanners.length > 0 ? dbBanners : FALLBACK_BANNERS;

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };

  const setSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(nextSlide, 6000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [nextSlide, currentIndex, banners.length]);

  useEffect(() => {
    if (currentIndex >= banners.length) {
      setCurrentIndex(0);
    }
  }, [banners.length, currentIndex]);

  // Responsive aspect ratios per spec #9: tall 9:16 on mobile, wide on desktop.
  const aspectClasses = "aspect-[9/16] sm:aspect-[16/9] lg:aspect-[5/2]";

  if (isLoading) {
    return (
      <section className="w-full bg-[#F2F0F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className={`w-full ${aspectClasses} rounded-2xl md:rounded-3xl bg-ink-100 animate-pulse`} />
        </div>
      </section>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? "100%" : "-100%", opacity: 0 }),
  };

  const currentBanner = banners[currentIndex] ?? banners[0];

  const renderSlideImage = (imgSrc: string, alt: string, priority: boolean) => {
    // Skip stale unsplash refs from old seed data; fall back to a bundled asset.
    const fallbackImage = FALLBACK_BANNERS[currentIndex % FALLBACK_BANNERS.length].imagePublicId;
    const safeImgSrc = imgSrc.includes("images.unsplash.com") ? fallbackImage : imgSrc;
    const isLocalOrRemoteUrl =
      safeImgSrc.startsWith("http://") ||
      safeImgSrc.startsWith("https://") ||
      safeImgSrc.startsWith("/");
    if (isLocalOrRemoteUrl) {
      return (
        <Image
          src={safeImgSrc}
          alt={alt}
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover object-center"
        />
      );
    }
    return (
      <CldImage
        src={safeImgSrc}
        alt={alt}
        fill
        crop="fill"
        gravity="auto"
        priority={priority}
        sizes="100vw"
        className="object-cover object-center"
      />
    );
  };

  return (
    <section className="w-full bg-[#F2F0F1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Full-bleed clickable banner (no overlaid copy, no CTA button) */}
        <div className={`relative w-full ${aspectClasses} overflow-hidden rounded-2xl md:rounded-3xl bg-ink-100 shadow-[0_10px_30px_rgba(40,44,63,0.10)] group`}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentBanner.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0"
            >
              <Link
                href={currentBanner.ctaUrl || "/products"}
                aria-label={currentBanner.title || "Shop the latest collection"}
                className="block w-full h-full"
              >
                {renderSlideImage(currentBanner.imagePublicId, currentBanner.title, currentIndex === 0)}
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Slide controls — only when there is more than one banner */}
          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous banner"
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-2.5 rounded-full bg-white/85 hover:bg-white text-ink-900 shadow-md backdrop-blur-xs transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next banner"
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-2.5 rounded-full bg-white/85 hover:bg-white text-ink-900 shadow-md backdrop-blur-xs transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Progress dots */}
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
                {banners.map((banner, index) => (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => setSlide(index)}
                    aria-label={`Go to banner ${index + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex ? "w-7 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

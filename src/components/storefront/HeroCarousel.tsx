"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
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
    title: "New Season Fashion",
    subtitle: "Fresh arrivals from verified Bangladeshi sellers — Cash on Delivery nationwide.",
    imagePublicId: "/banner-fallback-1.jpg",
    ctaUrl: "/products",
    position: "hero",
    active: true,
    order: 1,
  },
  {
    id: "fallback-2",
    title: "The Ethnic Edit",
    subtitle: "Sarees, kurtis & salwar kameez for every occasion.",
    imagePublicId: "/banner-fallback-2.jpg",
    ctaUrl: "/category/women",
    position: "hero",
    active: true,
    order: 2,
  },
  {
    id: "fallback-3",
    title: "Step Out in Style",
    subtitle: "Trending footwear to complete every look.",
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

  // Landscape banner ratios: moderate 4:3 on mobile (matches typical uploads),
  // widening to a cinematic 5:2 on desktop. object-cover keeps the image
  // undistorted; the scrim + copy sit on top.
  const aspectClasses = "aspect-[4/3] sm:aspect-[2/1] lg:aspect-[5/2]";

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
                className="block w-full h-full relative"
              >
                {renderSlideImage(currentBanner.imagePublicId, currentBanner.title, currentIndex === 0)}

                {/* Readability scrim — bottom-up on mobile, left-anchored on desktop */}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent sm:bg-gradient-to-r sm:from-black/70 sm:via-black/25 sm:to-transparent" />

                {/* Copy overlay (admin Title / Subtitle + CTA) */}
                <div className="absolute inset-0 flex flex-col justify-end sm:justify-center p-5 sm:p-10 lg:p-14">
                  <div className="max-w-[85%] sm:max-w-md space-y-2 sm:space-y-3">
                    {currentBanner.title && (
                      <h2 className="text-white font-display font-black uppercase tracking-wide leading-[1.05] text-2xl sm:text-4xl lg:text-5xl drop-shadow-sm">
                        {currentBanner.title}
                      </h2>
                    )}
                    {currentBanner.subtitle && (
                      <p className="text-white/90 text-xs sm:text-sm lg:text-base font-medium leading-snug line-clamp-2 sm:line-clamp-3 max-w-sm">
                        {currentBanner.subtitle}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1.5 bg-white text-ink-900 font-bold text-xs sm:text-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 shadow-md mt-1 group-hover:gap-2.5 transition-all">
                      Shop Now
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
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

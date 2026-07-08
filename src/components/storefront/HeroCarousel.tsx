"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useBanners } from "@/lib/hooks/useBanners";
import { CldImage } from "next-cloudinary";
import type { Banner } from "@/lib/types";

const FALLBACK_BANNERS: Banner[] = [
  {
    id: "fallback-1",
    title: "FIND CLOTHES THAT MATCH YOUR STYLE",
    subtitle: "Browse curated fashion and lifestyle products from verified Bangladeshi sellers.",
    imagePublicId: "/banner-fallback-1.jpg",
    ctaUrl: "/products",
    position: "hero",
    active: true,
    order: 1,
  },
  {
    id: "fallback-2",
    title: "ELEVATE YOUR EVERYDAY LOOKS",
    subtitle: "Discover quality menswear, womenswear, and everyday essentials in one marketplace.",
    imagePublicId: "/banner-fallback-2.jpg",
    ctaUrl: "/category/men",
    position: "hero",
    active: true,
    order: 2,
  },
  {
    id: "fallback-3",
    title: "STEP OUT IN PREMIUM FOOTWEAR",
    subtitle: "Complete your outfit with trending footwear and accessories for every occasion.",
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
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(nextSlide, 6000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [nextSlide, currentIndex]);

  useEffect(() => {
    if (currentIndex >= banners.length) {
      setCurrentIndex(0);
    }
  }, [banners.length, currentIndex]);

  if (isLoading) {
    return (
      <div className="w-full h-[460px] sm:h-[580px] lg:h-[680px] bg-gray-100 animate-pulse flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="h-16 bg-gray-200 rounded-xl w-3/4" />
            <div className="h-24 bg-gray-200 rounded-xl w-5/6" />
            <div className="h-12 bg-gray-200 rounded-full w-40" />
          </div>
          <div className="hidden md:block h-full bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const currentBanner = banners[currentIndex] ?? banners[0];

  const renderSlideImage = (imgSrc: string, alt: string) => {
    const fallbackImage = FALLBACK_BANNERS[currentIndex % FALLBACK_BANNERS.length].imagePublicId;
    const safeImgSrc = imgSrc.includes("images.unsplash.com") ? fallbackImage : imgSrc;
    const isLocalOrRemoteUrl = safeImgSrc.startsWith("http://") || safeImgSrc.startsWith("https://") || safeImgSrc.startsWith("/");
    if (isLocalOrRemoteUrl) {
      return (
        <Image
          src={safeImgSrc}
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center rounded-2xl md:rounded-3xl"
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
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover object-center rounded-2xl md:rounded-3xl"
      />
    );
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#F2F0F1] pt-6 pb-12 sm:py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative min-h-[460px] sm:min-h-[500px] md:min-h-[450px] lg:min-h-[500px] flex flex-col md:grid md:grid-cols-12 md:items-center gap-8 md:gap-12">
          <div className="md:col-span-6 flex flex-col justify-center text-left space-y-4 sm:space-y-6 max-w-xl">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentBanner.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                className="space-y-4 sm:space-y-6"
              >
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="text-4xl sm:text-5xl lg:text-[60px] lg:leading-[60px] font-black tracking-tight text-black uppercase"
                >
                  {currentBanner.title}
                </motion.h1>

                {currentBanner.subtitle ? (
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="text-sm sm:text-base text-black/60 leading-relaxed font-light"
                  >
                    {currentBanner.subtitle}
                  </motion.p>
                ) : null}

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="pt-2"
                >
                  <Link
                    href={currentBanner.ctaUrl || "/products"}
                    className="w-full sm:w-52 py-4 px-8 inline-flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 transition-colors text-white rounded-sm font-bold text-sm uppercase tracking-widest group focus:outline-none"
                  >
                    <span>Shop Now</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="md:col-span-6 relative aspect-square md:aspect-[4/3] lg:aspect-[4/3] w-full min-h-[300px] sm:min-h-[400px] md:min-h-[360px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentBanner.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                className="w-full h-full relative"
              >
                {renderSlideImage(currentBanner.imagePublicId, currentBanner.title)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-8 md:mt-12 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setSlide(index)}
                aria-label={`Go to banner ${index + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "w-8 bg-black" : "w-2.5 bg-black/20"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={prevSlide}
              className="p-2.5 rounded-full border border-black/10 bg-white text-black hover:bg-black hover:text-white transition-all shadow-xs focus:outline-none"
              aria-label="Previous banner"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="p-2.5 rounded-full border border-black/10 bg-white text-black hover:bg-black hover:text-white transition-all shadow-xs focus:outline-none"
              aria-label="Next banner"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
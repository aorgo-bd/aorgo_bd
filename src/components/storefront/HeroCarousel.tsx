"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useBanners } from "@/lib/hooks/useBanners";
import { CldImage } from "next-cloudinary";

// High-end default fallbacks in case banners collection is empty in Firestore
const FALLBACK_BANNERS = [
  {
    id: "fallback-1",
    title: "FIND CLOTHES THAT MATCH YOUR STYLE",
    subtitle: "Browse through our diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style.",
    imagePublicId: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80",
    ctaUrl: "/products",
  },
  {
    id: "fallback-2",
    title: "ELEVATE YOUR EVERYDAY LOOKS",
    subtitle: "Discover comfort and unmatched quality with our premium menswear collection, custom-tailored for the modern lifestyle.",
    imagePublicId: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80",
    ctaUrl: "/category/men",
  },
  {
    id: "fallback-3",
    title: "STEP OUT IN PREMIUM FOOTWEAR",
    subtitle: "Complete your outfit with trending sneakers, sandals, and formal footwear crafted with fine Bangladeshi leather.",
    imagePublicId: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80",
    ctaUrl: "/category/footwear",
  },
];

export default function HeroCarousel() {
  const { data: dbBanners = [], isLoading, error } = useBanners("hero");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const banners = dbBanners.length > 0 ? dbBanners : FALLBACK_BANNERS;

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };

  const setSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Reset autoplay timer
  const resetAutoplay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(nextSlide, 6000);
  };

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [currentIndex, banners.length]);

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

  // Slide transition animation definitions
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

  const currentBanner = banners[currentIndex];

  // Helper function to resolve image rendering
  const renderSlideImage = (imgSrc: string, alt: string) => {
    const isUrl = imgSrc.startsWith("http://") || imgSrc.startsWith("https://") || imgSrc.startsWith("/");
    if (isUrl) {
      return (
        <Image
          src={imgSrc}
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
        src={imgSrc}
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
        
        {/* Carousel Container */}
        <div className="relative min-h-[460px] sm:min-h-[500px] md:min-h-[450px] lg:min-h-[500px] flex flex-col md:grid md:grid-cols-12 md:items-center gap-8 md:gap-12">
          
          {/* Left Text Block */}
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
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="text-sm sm:text-base text-black/60 leading-relaxed font-light"
                >
                  {currentBanner.subtitle}
                </motion.p>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="pt-2"
                >
                  <Link
                    href={currentBanner.ctaUrl || "/products"}
                    className="w-full sm:w-52 py-4 px-8 inline-flex items-center justify-center gap-2 bg-black hover:bg-black/80 transition-colors text-white rounded-full font-bold text-sm tracking-wide shadow-md group focus:outline-none"
                  >
                    <span>Shop Now</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Image Block */}
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

        {/* Carousel Controls */}
        <div className="mt-8 md:mt-12 flex items-center justify-between">
          {/* Progress Indicators / Dots */}
          <div className="flex items-center space-x-2">
            {banners.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => setSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "w-8 bg-black" : "w-2.5 bg-black/20"
                }`}
              />
            ))}
          </div>

          {/* Nav Arrows */}
          <div className="flex items-center space-x-2">
            <button
              onClick={prevSlide}
              className="p-2.5 rounded-full border border-black/10 bg-white text-black hover:bg-black hover:text-white transition-all shadow-xs focus:outline-none"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextSlide}
              className="p-2.5 rounded-full border border-black/10 bg-white text-black hover:bg-black hover:text-white transition-all shadow-xs focus:outline-none"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}

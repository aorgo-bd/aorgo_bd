"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CldImage } from "next-cloudinary";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/5] bg-gray-100 flex items-center justify-center rounded-2xl text-gray-400">
        No Images Available
      </div>
    );
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      // Swiped Left -> Next Image
      if (activeIndex < images.length - 1) {
        setActiveIndex(activeIndex + 1);
      }
    } else if (info.offset.x > swipeThreshold) {
      // Swiped Right -> Prev Image
      if (activeIndex > 0) {
        setActiveIndex(activeIndex - 1);
      }
    }
  };

  // Base64 grey blur placeholder
  const blurPlaceholder = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iMTAwMCIgdmlld0JveD0iMCAwIDgwMCAxMDAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+";

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      {/* Thumbnails Sidebar - Desktop Only */}
      <div className="hidden lg:flex flex-col gap-3.5 order-2 lg:order-1">
        {images.map((img, idx) => (
          <button
            key={img}
            onClick={() => setActiveIndex(idx)}
            className={`w-20 h-24 rounded-xl overflow-hidden border-2 transition-all relative ${
              activeIndex === idx
                ? "border-black shadow-md scale-102"
                : "border-transparent hover:border-gray-300 opacity-80 hover:opacity-100"
            }`}
          >
            <CldImage
              src={img}
              alt={`${title} thumbnail ${idx + 1}`}
              width={160}
              height={200}
              crop="fill"
              gravity="auto"
              placeholder="blur"
              blurDataURL={blurPlaceholder}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main Image Container */}
      <div className="flex-1 order-1 lg:order-2 relative aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group shadow-xs">
        {/* Navigation arrows (shown on hover on desktop, always on mobile) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white backdrop-blur-xs text-black transition-all rounded-full shadow-md z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white backdrop-blur-xs text-black transition-all rounded-full shadow-md z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Hover zoom helper indicator for desktop */}
        <div className="hidden lg:flex absolute bottom-4 right-4 items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-xs text-white rounded-full text-[10px] font-medium tracking-wide z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase">
          <ZoomIn className="h-3.5 w-3.5" />
          <span>Hover to Zoom</span>
        </div>

        {/* Swipe indicator dots for mobile */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 lg:hidden">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeIndex === idx ? "w-4.5 bg-black" : "w-1.5 bg-black/30"
                }`}
              />
            ))}
          </div>
        )}

        {/* Animated Main Image wrapper */}
        <div
          className="w-full h-full relative overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setMousePos({ x: 50, y: 50 });
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragEnd={handleDragEnd}
              className="w-full h-full select-none"
            >
              <CldImage
                src={images[activeIndex]}
                alt={title}
                width={800}
                height={1000}
                crop="fill"
                gravity="auto"
                priority={activeIndex === 0}
                placeholder="blur"
                blurDataURL={blurPlaceholder}
                className="w-full h-full object-cover select-none pointer-events-none lg:pointer-events-auto transition-transform duration-200 ease-out"
                style={{
                  transform: isHovered ? "scale(2)" : "scale(1)",
                  transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Thumbnails row - Mobile Only */}
      <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 scrollbar-none order-3 px-1">
        {images.map((img, idx) => (
          <button
            key={img}
            onClick={() => setActiveIndex(idx)}
            className={`w-14 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
              activeIndex === idx
                ? "border-black scale-102 shadow-xs"
                : "border-transparent opacity-75"
            }`}
          >
            <CldImage
              src={img}
              alt={`${title} thumbnail ${idx + 1}`}
              width={112}
              height={128}
              crop="fill"
              gravity="auto"
              placeholder="blur"
              blurDataURL={blurPlaceholder}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

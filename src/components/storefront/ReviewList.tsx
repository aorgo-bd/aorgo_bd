"use client";

import React, { useState } from "react";
import { useReviews } from "@/lib/hooks/useReviews";
import { Review } from "@/lib/types";
import { CldImage } from "next-cloudinary";
import { Star, ShieldCheck, MessageSquare, X } from "lucide-react";

interface ReviewListProps {
  productId: string;
}

export default function ReviewList({ productId }: ReviewListProps) {
  const { data: reviews = [], isLoading } = useReviews(productId);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4 py-8 animate-pulse">
        <div className="h-6 bg-gray-200 rounded-md w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="h-32 bg-gray-200 rounded-2xl col-span-2" />
        </div>
      </div>
    );
  }

  // 1. Overall stats
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((acc: number, r: Review) => acc + r.rating, 0) / totalReviews
      : 0;

  // Star distribution
  const distribution = [0, 0, 0, 0, 0]; // index 0 = 5 star, ..., 4 = 1 star
  reviews.forEach((r: Review) => {
    const idx = 5 - Math.round(r.rating);
    if (idx >= 0 && idx < 5) {
      distribution[idx]++;
    }
  });

  // Extract all review photos
  const allPhotos = reviews.flatMap((r: Review) => r.photos || []);

  const formatDate = (ms: number) => {
    if (!ms) return "";
    return new Date(ms).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Base64 grey blur placeholder
  const blurPlaceholder = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iMTAwMCIgdmlld0JveD0iMCAwIDgwMCAxMDAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+";

  return (
    <div className="space-y-8 py-8 border-t border-gray-100">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-black" />
        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">
          Customer Reviews ({totalReviews})
        </h3>
      </div>

      {totalReviews === 0 ? (
        <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-sm font-medium text-gray-400">No reviews yet for this product.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats & Histogram Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
            {/* Average Score */}
            <div className="text-center md:border-r border-gray-150 py-4">
              <span className="text-5xl font-black text-black">
                {averageRating.toFixed(1)}
              </span>
              <div className="flex justify-center gap-1.5 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(averageRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Based on {totalReviews} rating{totalReviews > 1 ? "s" : ""}
              </p>
            </div>

            {/* Histogram Progress Bars */}
            <div className="col-span-2 space-y-2.5">
              {distribution.map((count, index) => {
                const starVal = 5 - index;
                const percentage = (count / totalReviews) * 100;
                return (
                  <div key={starVal} className="flex items-center gap-3 text-sm">
                    <span className="w-3 font-semibold text-gray-700">{starVal}</span>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                    <div className="flex-1 h-2 bg-gray-200/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium text-gray-400 text-xs">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Photo Grid Section */}
          {allPhotos.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                Photos from Customers
              </h4>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {allPhotos.map((photo: string, idx: number) => (
                  <button
                    key={photo + idx}
                    onClick={() => setLightboxPhoto(photo)}
                    className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100 hover:border-gray-300 transition-colors shadow-2xs relative"
                  >
                    <CldImage
                      src={photo}
                      alt="Customer review photo"
                      width={160}
                      height={160}
                      crop="fill"
                      gravity="auto"
                      placeholder="blur"
                      blurDataURL={blurPlaceholder}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="divide-y divide-gray-100">
            {reviews.map((review: Review) => (
              <div key={review.id} className="py-6 first:pt-0 last:pb-0 space-y-3">
                {/* Header: Stars & Date */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {formatDate(review.createdAt)}
                  </span>
                </div>

                {/* Body Content */}
                <div className="space-y-1">
                  {/* Customer name and verified badge */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-900">
                      {review.customerName || "Verified Customer"}
                    </span>
                    {review.verified && (
                      <div className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90 origin-left border border-emerald-100/30">
                        <ShieldCheck className="h-3 w-3 shrink-0" />
                        <span>Verified Buyer</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed font-normal">
                    {review.text}
                  </p>
                </div>

                {/* Review Specific Photos */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {review.photos.map((photo: string, pIdx: number) => (
                      <button
                        key={photo + pIdx}
                        onClick={() => setLightboxPhoto(photo)}
                        className="w-16 h-16 rounded-lg overflow-hidden border border-gray-100 hover:border-gray-200 shadow-2xs relative"
                      >
                        <CldImage
                          src={photo}
                          alt="Customer uploaded review photo"
                          width={128}
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
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal Overlay */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all focus:outline-none"
            aria-label="Close image"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative max-w-full max-h-[85vh] aspect-[3/4] sm:aspect-auto sm:h-[80vh] w-auto overflow-hidden rounded-2xl shadow-2xl cursor-default" onClick={(e) => e.stopPropagation()}>
            <CldImage
              src={lightboxPhoto}
              alt="Review Photo Lightbox"
              width={1200}
              height={1600}
              crop="fit"
              className="w-full h-full object-contain max-h-[80vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

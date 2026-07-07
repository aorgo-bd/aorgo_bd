"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema, ReviewFormData } from "@/lib/schemas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Camera, X, Loader2 } from "lucide-react";
import { CldUploadWidget, CldImage } from "next-cloudinary";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase/client";
import toast from "react-hot-toast";

interface ReviewFormProps {
  productId: string;
  productTitle: string;
  orderId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function ReviewForm({
  productId,
  productTitle,
  orderId,
  isOpen,
  onOpenChange,
  onSuccess,
}: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      productId,
      orderId,
      rating: 5,
      text: "",
      photos: [],
    },
  });

  const rating = watch("rating");
  const photos = watch("photos") || [];

  const handlePhotoUploaded = (publicId: string) => {
    setValue("photos", [...photos, publicId], { shouldValidate: true });
    toast.success("Photo uploaded successfully!");
  };

  const handleRemovePhoto = (idxToRemove: number) => {
    setValue(
      "photos",
      photos.filter((_, idx) => idx !== idxToRemove),
      { shouldValidate: true }
    );
  };

  const onSubmitReview = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        toast.error("You must be logged in to submit a review.");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      });

      const resBody = await response.json();

      if (!response.ok) {
        throw new Error(resBody.error || "Failed to submit review.");
      }

      toast.success("Review submitted! Thank you for your feedback.");
      reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Failed to submit review:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const blurPlaceholder =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iMTAwMCIgdmlld0JveD0iMCAwIDgwMCAxMDAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-gray-900 tracking-tight uppercase">
            Write a Review
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 font-medium leading-relaxed">
            Share your experience with <strong className="text-gray-800">{productTitle}</strong>. Your feedback helps others make better choices!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-6 pt-4">
          {/* Star Rating Input */}
          <div className="flex flex-col items-center justify-center space-y-2 py-4 bg-gray-50/50 rounded-2xl border border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Tap to Rate
            </span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setValue("rating", star, { shouldValidate: true })}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors duration-150 cursor-pointer",
                      star <= (hoverRating ?? rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300 fill-transparent"
                    )}
                  />
                </button>
              ))}
            </div>
            {errors.rating && (
              <p className="text-xs text-red-500 font-semibold">{errors.rating.message}</p>
            )}
          </div>

          {/* Comment Text Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-550 uppercase tracking-wider block">
              Your Review *
            </label>
            <Textarea
              placeholder="What did you like or dislike about the product? Mention fit, quality, material, etc."
              rows={4}
              {...register("text")}
              className={cn(
                "w-full rounded-2xl bg-gray-50/50 border border-gray-100 focus:bg-white transition-all text-sm resize-none",
                errors.text && "border-red-500 focus-visible:ring-red-100"
              )}
            />
            {errors.text ? (
              <p className="text-[11px] text-red-500 font-semibold">{errors.text.message}</p>
            ) : (
              <p className="text-[10px] text-gray-400 font-medium">Min 5, Max 500 characters.</p>
            )}
          </div>

          {/* Photo Uploader Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-550 uppercase tracking-wider block">
              Add Photos (Optional)
            </label>

            {/* Thumbnail previews */}
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2.5 mb-2">
                {photos.map((photo, idx) => (
                  <div
                    key={photo + idx}
                    className="relative w-16 h-16 rounded-xl border border-gray-150 overflow-hidden shadow-2xs group"
                  >
                    <CldImage
                      src={photo}
                      alt="Review upload thumbnail"
                      width={128}
                      height={128}
                      crop="fill"
                      placeholder="blur"
                      blurDataURL={blurPlaceholder}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute -top-1 -right-1 p-1 bg-black/80 hover:bg-black text-white rounded-full transition-colors cursor-pointer shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {photos.length < 5 ? (
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                options={{
                  multiple: true,
                  maxFiles: 5 - photos.length,
                  sources: ["local", "url", "camera"],
                  clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
                  maxFileSize: 5 * 1024 * 1024, // 5MB
                }}
                onSuccess={(res) => {
                  const info = res.info as any;
                  if (info?.public_id) {
                    handlePhotoUploaded(info.public_id);
                  }
                }}
              >
                {({ open }) => (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => open()}
                    className="w-full py-6 border-dashed border-2 hover:bg-gray-50 flex items-center justify-center gap-2 rounded-2xl text-xs font-bold text-gray-600 transition-colors shadow-2xs border-gray-200"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Upload Product Photos ({photos.length}/5)</span>
                  </Button>
                )}
              </CldUploadWidget>
            ) : (
              <p className="text-[10px] text-gray-400 font-semibold">Maximum photo upload limit reached.</p>
            )}
            {errors.photos && (
              <p className="text-xs text-red-500 font-semibold">{errors.photos.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="font-bold text-xs uppercase text-gray-500 hover:bg-gray-50 hover:text-black rounded-xl px-4 h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black hover:bg-black/90 text-white font-bold text-xs uppercase rounded-xl px-6 h-10 shadow-md flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Review</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

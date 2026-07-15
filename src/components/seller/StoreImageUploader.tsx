"use client";

import React from "react";
import { CldUploadWidget } from "next-cloudinary";
import { ProductImage } from "@/components/ProductImage";
import { UploadCloud, Trash2, ImageIcon, RefreshCw } from "lucide-react";

interface StoreImageUploaderProps {
  /** Current Cloudinary public id (or empty string). */
  value: string;
  /** Called with the new public id after a successful upload. */
  onChange: (publicId: string) => void;
  /** Called when the user clears the current image. */
  onRemove: () => void;
  /** Preview aspect: square for logos, wide for cover banners. */
  aspect?: "square" | "wide";
  label: string;
  hint?: string;
}

/**
 * Single-image Cloudinary uploader for store branding (logo / cover banner).
 * Shows a live preview and lets the seller upload, replace, or remove the
 * image — no need to know a Cloudinary public id. Uses the same unsigned
 * upload preset as product photos.
 */
export function StoreImageUploader({
  value,
  onChange,
  onRemove,
  aspect = "square",
  label,
  hint,
}: StoreImageUploaderProps) {
  const isWide = aspect === "wide";

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
        {label}
      </label>

      <div
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 ${
          isWide ? "aspect-[16/5]" : "aspect-square max-w-[180px]"
        }`}
      >
        {value ? (
          <>
            <ProductImage
              src={value}
              alt={label}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-red-600 shadow hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400">
            <ImageIcon className="h-7 w-7" strokeWidth={1.5} />
            <span className="text-[11px] font-semibold">No image yet</span>
          </div>
        )}
      </div>

      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        options={{ multiple: false, maxFiles: 1, sources: ["local", "url", "camera"] }}
        onSuccess={(res) => {
          const info = res.info as any;
          if (info?.public_id) onChange(info.public_id);
        }}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 h-10 text-xs font-bold uppercase tracking-wider text-slate-700 hover:border-pink-300 hover:text-pink-600 transition-colors"
          >
            {value ? (
              <>
                <RefreshCw className="h-4 w-4" /> Change {label}
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" /> Upload {label}
              </>
            )}
          </button>
        )}
      </CldUploadWidget>

      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

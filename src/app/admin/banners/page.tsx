"use client";

import React, { useState, useMemo } from "react";
import { useAdminBanners } from "@/lib/hooks/useAdmin";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bannerFormSchema, BannerFormData } from "@/lib/schemas";
import { Banner } from "@/lib/types";
import { CldUploadWidget, CldImage } from "next-cloudinary";
import Image from "next/image";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getFreshIdToken } from "@/lib/firebase/client-token";

export default function AdminBannersPage() {
  const { data: banners = [], isLoading, refetch } = useAdminBanners();
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form Setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerFormSchema) as any,
    defaultValues: {
      title: "",
      subtitle: "",
      imagePublicId: "",
      ctaUrl: "",
      position: "hero",
      active: true,
      order: 0,
    },
  });

  const imagePublicId = watch("imagePublicId");

  // Handle Form Open for Create
  const handleCreateOpen = () => {
    reset({
      title: "",
      subtitle: "",
      imagePublicId: "",
      ctaUrl: "",
      position: "hero",
      active: true,
      order: banners.length,
    });
    setEditingBanner(null);
    setIsFormOpen(true);
  };

  // Handle Form Open for Edit
  const handleEditOpen = (banner: Banner) => {
    setEditingBanner(banner);
    reset({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      imagePublicId: banner.imagePublicId || "",
      ctaUrl: banner.ctaUrl || "",
      position: banner.position || "hero",
      active: banner.active ?? true,
      order: banner.order ?? 0,
    });
    setIsFormOpen(true);
  };

  // Submit Banner Creation or Update
  const onSubmit = async (data: BannerFormData) => {
    setSubmitLoading(true);
    try {
      const idToken = await getFreshIdToken();
      const url = "/api/admin/banners";
      const method = editingBanner ? "PUT" : "POST";
      const body = editingBanner
        ? { id: editingBanner.id, ...data }
        : data;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || "Failed to save banner");
      }

      toast.success(editingBanner ? "Banner updated successfully!" : "New banner created successfully!");
      setIsFormOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete Banner
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner permanently?")) return;
    setIsDeletingId(id);
    try {
      const idToken = await getFreshIdToken();
      const res = await fetch(`/api/admin/banners?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || "Failed to delete banner");
      }

      toast.success("Banner deleted successfully");
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setIsDeletingId(null);
    }
  };

  // Quick Toggle Active State
  const handleToggleActive = async (banner: Banner) => {
    try {
      const idToken = await getFreshIdToken();
      const res = await fetch("/api/admin/banners", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          id: banner.id,
          title: banner.title,
          subtitle: banner.subtitle,
          imagePublicId: banner.imagePublicId,
          ctaUrl: banner.ctaUrl,
          position: banner.position,
          active: !banner.active,
          order: banner.order,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update banner");
      }

      toast.success(`Banner is now ${!banner.active ? "active" : "inactive"}`);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    }
  };

  // Dynamic Image Renderer
  const renderBannerThumb = (imgSrc: string, alt: string) => {
    if (!imgSrc) return null;
    const isUrl = imgSrc.startsWith("http://") || imgSrc.startsWith("https://") || imgSrc.startsWith("/");
    if (isUrl) {
      return (
        <Image
          src={imgSrc}
          alt={alt}
          fill
          sizes="(max-width: 120px) 100vw, 120px"
          className="object-cover object-center rounded-lg"
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
        sizes="(max-width: 120px) 100vw, 120px"
        className="object-cover object-center rounded-lg"
      />
    );
  };

  const sortedBanners = useMemo(() => {
    return [...banners].sort((a: Banner, b: Banner) => (a.order ?? 0) - (b.order ?? 0));
  }, [banners]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Promotional Banners
          </h1>
          <p className="text-sm text-slate-500">
            Manage storefront hero carousels, category dividers, and marketing placements.
          </p>
        </div>
        <Button
          onClick={handleCreateOpen}
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-600/10 gap-2 rounded-xl"
        >
          <Plus className="h-4 w-4" /> Add Banner
        </Button>
      </div>

      {/* Grid of Banners */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">Loading active banners...</p>
        </div>
      ) : sortedBanners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedBanners.map((banner) => (
            <Card
              key={banner.id}
              className={`overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md transition-all ${
                !banner.active ? "opacity-75" : ""
              }`}
            >
              <CardContent className="p-5 flex gap-4">
                <div className="relative w-32 h-20 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                  {renderBannerThumb(banner.imagePublicId, banner.title)}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-extrabold text-slate-800 dark:text-slate-100 truncate text-sm">
                        {banner.title}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`text-[9px] uppercase tracking-wider px-1.5 font-bold ${
                          banner.position === "hero"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20"
                            : banner.position === "mid"
                            ? "bg-violet-50 text-violet-700 dark:bg-violet-950/20"
                            : "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/20"
                        }`}
                      >
                        {banner.position}
                      </Badge>
                    </div>
                    {banner.subtitle && (
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {banner.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>Order: <span className="font-semibold text-slate-600">{banner.order}</span></span>
                      <span>•</span>
                      <a
                        href={banner.ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-violet-500 hover:underline font-semibold"
                      >
                        CTA URL <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-3 mt-2">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                    >
                      {banner.active ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          <span className="text-emerald-600">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-400">Inactive</span>
                        </>
                      )}
                    </button>

                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-500 hover:text-violet-600"
                        onClick={() => handleEditOpen(banner)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-500 hover:text-red-600"
                        disabled={isDeletingId === banner.id}
                        onClick={() => handleDelete(banner.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-400">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-slate-300 dark:text-slate-800" />
          <p className="font-semibold text-slate-700 dark:text-slate-350">No promotional banners yet</p>
          <p className="text-xs text-slate-400">Add marketing assets using the button above.</p>
        </div>
      )}

      {/* Create / Edit Dialog Modal */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && setIsFormOpen(false)}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6 border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-violet-500" />
              {editingBanner ? "Modify Banner" : "Create Banner Asset"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide the promotional tagline, layout slot location, navigation path, and select the image asset.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1">Title</label>
              <Input
                {...register("title")}
                placeholder="e.g. FIND CLOTHES THAT MATCH YOUR STYLE"
                className="bg-slate-50 border-slate-200 focus:bg-white text-sm"
              />
              {errors.title && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.title.message}</p>}
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1">Subtitle (Optional)</label>
              <Input
                {...register("subtitle")}
                placeholder="e.g. Browse through our diverse range of meticulously crafted garments"
                className="bg-slate-50 border-slate-200 focus:bg-white text-sm"
              />
              {errors.subtitle && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.subtitle.message}</p>}
            </div>

            {/* Cloudinary Upload Widget */}
            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1">Image Asset</label>
              <div className="flex items-center gap-4">
                <CldUploadWidget
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                  options={{ multiple: false, maxFiles: 1, sources: ["local", "url"] }}
                  onSuccess={(res) => setValue("imagePublicId", (res.info as any).public_id)}
                >
                  {({ open }) => (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => open()}
                      className="border-slate-200 text-xs font-semibold hover:bg-slate-50"
                    >
                      Choose / Upload Photo
                    </Button>
                  )}
                </CldUploadWidget>

                <div className="relative h-12 w-20 overflow-hidden bg-slate-100 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                  {imagePublicId ? (
                    renderBannerThumb(imagePublicId, "Preview")
                  ) : (
                    <span>No Image</span>
                  )}
                </div>
              </div>
              <input type="hidden" {...register("imagePublicId")} />
              {errors.imagePublicId && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.imagePublicId.message}</p>}
            </div>

            {/* CTA URL */}
            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1">CTA URL</label>
              <Input
                {...register("ctaUrl")}
                placeholder="e.g. /category/men or /products"
                className="bg-slate-50 border-slate-200 focus:bg-white text-sm"
              />
              {errors.ctaUrl && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ctaUrl.message}</p>}
            </div>

            {/* Position & Order */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1">Position</label>
                <select
                  {...register("position")}
                  className="w-full h-10 border border-slate-200 bg-slate-50 rounded-lg px-3 text-sm font-medium text-slate-700 focus:outline-none focus:bg-white"
                >
                  <option value="hero">Hero Carousel</option>
                  <option value="mid">Mid Divider</option>
                  <option value="footer">Footer Banner</option>
                </select>
                {errors.position && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.position.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1">Order</label>
                <Input
                  type="number"
                  {...register("order")}
                  placeholder="0"
                  className="bg-slate-50 border-slate-200 focus:bg-white text-sm"
                />
                {errors.order && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.order.message}</p>}
              </div>
            </div>

            {/* Active Switch */}
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="banner-active"
                className="rounded text-violet-650 focus:ring-violet-500 h-4 w-4 border-slate-200"
                {...register("active")}
              />
              <label htmlFor="banner-active" className="text-xs font-semibold text-slate-600">
                Immediately enable this banner
              </label>
            </div>

            <DialogFooter className="flex sm:justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg text-xs font-semibold border-slate-200"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitLoading}
                className="rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white"
              >
                {submitLoading ? "Saving..." : editingBanner ? "Save Changes" : "Create Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

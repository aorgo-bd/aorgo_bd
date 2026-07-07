"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, ProductFormData } from "@/lib/schemas";
import { useCategories } from "@/lib/hooks/useCategories";
import { ProductImageUploader } from "@/components/ProductImageUploader";
import { ProductImage } from "@/components/ProductImage";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  BadgeCent,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Trash2,
  Plus,
  Grid,
  Check,
  MoveLeft,
  MoveRight,
  AlertCircle,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ProductFormProps {
  initialData?: any;
  isSubmitting: boolean;
  onSubmit: (data: ProductFormData) => void;
}

export function ProductForm({ initialData, isSubmitting, onSubmit }: ProductFormProps) {
  const { data: categories = [] } = useCategories();
  
  // Local state for variant matrix builder
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState("");
  const [customColor, setCustomColor] = useState("");

  const commonSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "36", "37", "38", "39", "40", "41", "42", "43", "44"];
  const commonColors = ["Black", "White", "Grey", "Red", "Blue", "Green", "Navy", "Pink", "Beige", "Yellow", "Maroon"];

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData
      ? {
          title: initialData.title || "",
          description: initialData.description || "",
          brand: initialData.brand || "",
          category: initialData.category || "",
          gender: initialData.gender || "unisex",
          price: initialData.price || 0,
          comparePrice: initialData.comparePrice || undefined,
          images: initialData.images || [],
          variants: initialData.variants || [],
          attributes: {
            fit: initialData.attributes?.fit || undefined,
            fabric: initialData.attributes?.fabric || "",
            occasion: initialData.attributes?.occasion || [],
          },
        }
      : {
          title: "",
          description: "",
          brand: "",
          category: "",
          gender: "unisex",
          price: 0,
          comparePrice: undefined,
          images: [],
          variants: [],
          attributes: {
            fit: undefined,
            fabric: "",
            occasion: [],
          },
        },
  });

  const { fields: variantFields, append, remove, replace } = useFieldArray({
    control,
    name: "variants",
  });

  const productImages = watch("images") || [];
  const brandName = watch("brand") || "";
  const productTitle = watch("title") || "";

  // Categorize categories into parents and subcategories
  const parentCategories = categories.filter((c: any) => c.parent === null);
  const getSubcategories = (parentSlug: string) => {
    return categories.filter((c: any) => c.parent === parentSlug);
  };

  // Pre-populate sizes/colors if in edit mode
  useEffect(() => {
    if (initialData?.variants?.length) {
      const sizes = Array.from(new Set(initialData.variants.map((v: any) => v.size))) as string[];
      const colors = Array.from(new Set(initialData.variants.map((v: any) => v.color))) as string[];
      setSelectedSizes(sizes);
      setSelectedColors(colors);
    }
  }, [initialData]);

  // Image helpers
  const handleImageUploaded = (publicId: string) => {
    setValue("images", [...productImages, publicId]);
    toast.success("Image uploaded successfully!");
  };

  const handleRemoveImage = (index: number) => {
    const updated = [...productImages];
    const removedId = updated.splice(index, 1)[0];
    setValue("images", updated);

    // If any variant has mapped image, clear it if removed
    const currentVariants = watch("variants") || [];
    const fixedVariants = currentVariants.map((v: any) => {
      if (v.imagePublicId === removedId) {
        return { ...v, imagePublicId: undefined };
      }
      return v;
    });
    setValue("variants", fixedVariants);
  };

  const handleMoveImage = (index: number, direction: "left" | "right") => {
    if (direction === "left" && index === 0) return;
    if (direction === "right" && index === productImages.length - 1) return;

    const targetIdx = direction === "left" ? index - 1 : index + 1;
    const updated = [...productImages];
    
    // Swap
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    setValue("images", updated);
  };

  // Variant helper functions
  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const addCustomSize = () => {
    const clean = customSize.trim().toUpperCase();
    if (!clean) return;
    if (!selectedSizes.includes(clean)) {
      setSelectedSizes((prev) => [...prev, clean]);
    }
    setCustomSize("");
  };

  const addCustomColor = () => {
    const clean = customColor.trim();
    if (!clean) return;
    const formatted = clean.charAt(0).toUpperCase() + clean.slice(1);
    if (!selectedColors.includes(formatted)) {
      setSelectedColors((prev) => [...prev, formatted]);
    }
    setCustomColor("");
  };

  const generateVariantMatrix = () => {
    if (selectedSizes.length === 0 || selectedColors.length === 0) {
      toast.error("Please select at least one Size and one Color to generate the matrix.");
      return;
    }

    const currentVariants = watch("variants") || [];
    const newVariants: any[] = [];

    selectedSizes.forEach((size) => {
      selectedColors.forEach((color) => {
        // Look if variant combination already exists
        const existing = currentVariants.find((v: any) => v.size === size && v.color === color);
        
        if (existing) {
          newVariants.push(existing);
        } else {
          // Generate new SKU: BRAND-TITLE-SIZE-COLOR (slugified)
          const slugify = (text: string) =>
            text
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");

          const sku = `${slugify(brandName || "brand")}-${slugify(productTitle || "title")}-${slugify(size)}-${slugify(color)}`;

          newVariants.push({
            sku,
            size,
            color,
            stock: 0,
            imagePublicId: productImages[0] || "",
          });
        }
      });
    });

    replace(newVariants);
    toast.success(`Generated variant matrix grid with ${newVariants.length} combinations!`);
  };

  const onFormSubmit = (data: any) => {
    onSubmit(data as ProductFormData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 pb-12">
      {/* 1. Basic Information */}
      <div className="rounded-3xl border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60 p-6 md:p-8 shadow-sm backdrop-blur-md space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100">Basic Product Information</h3>
            <p className="text-xs text-slate-400">Provide product name, description, brand and categories.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Product Title <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("title")}
              placeholder="e.g. Traditional Cotton Block Print Saree"
              className="mt-1"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {String(errors.title.message)}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Product Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              {...register("description")}
              placeholder="Provide a detailed overview about style, weaving craftsmanship, fabric care, dimensions..."
              className="mt-1 h-32 leading-relaxed"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {String(errors.description.message)}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("brand")}
              placeholder="e.g. Aarong"
              className="mt-1"
            />
            {errors.brand && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {String(errors.brand.message)}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register("category")}
              className="w-full mt-1 h-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">Select Subcategory</option>
              {parentCategories.map((parent: any) => (
                <optgroup key={parent.slug} label={parent.name}>
                  {getSubcategories(parent.slug).map((sub: any) => (
                    <option key={sub.slug} value={sub.slug}>
                      {sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {String(errors.category.message)}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Gender Alignment <span className="text-red-500">*</span>
            </label>
            <select
              {...register("gender")}
              className="w-full mt-1 h-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="unisex">Unisex</option>
              <option value="women">Women</option>
              <option value="men">Men</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Pricing Section */}
      <div className="rounded-3xl border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60 p-6 md:p-8 shadow-sm backdrop-blur-md space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600">
            <BadgeCent className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100">Pricing details</h3>
            <p className="text-xs text-slate-400">Set catalog prices. Price is stored as BDT (৳) integer.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Selling Price (৳) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              placeholder="e.g. 1200"
              className="mt-1"
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {String(errors.price.message)}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Original/Compare Price (৳) <span className="text-slate-400">(Optional)</span>
            </label>
            <Input
              type="number"
              placeholder="e.g. 1500"
              className="mt-1"
              {...register("comparePrice", { valueAsNumber: true })}
            />
            {errors.comparePrice && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {String(errors.comparePrice.message)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Images Upload Section */}
      <div className="rounded-3xl border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60 p-6 md:p-8 shadow-sm backdrop-blur-md space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100">Product Images</h3>
            <p className="text-xs text-slate-400">Upload up to 8 images. Drag or swap to sort. Leftmost is primary.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {productImages.map((imageId: string, idx: number) => (
              <div
                key={imageId}
                className={cn(
                  "relative group flex flex-col h-40 w-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-sm transition-all duration-200",
                  idx === 0 && "ring-2 ring-indigo-500"
                )}
              >
                <div className="flex-1 overflow-hidden relative">
                  <ProductImage
                    src={imageId}
                    alt={`Upload ${idx}`}
                    className="h-full w-full object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[8px] font-bold text-white bg-indigo-600 rounded">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {/* Image controls */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-2 py-1.5 bg-slate-50/50">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleMoveImage(idx, "left")}
                    disabled={idx === 0}
                    className="h-6 w-6 p-0 text-slate-500 hover:text-slate-800"
                  >
                    <MoveLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-[10px] font-semibold text-slate-400">Img {idx + 1}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleMoveImage(idx, "right")}
                    disabled={idx === productImages.length - 1}
                    className="h-6 w-6 p-0 text-slate-500 hover:text-slate-800"
                  >
                    <MoveRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            {productImages.length < 8 && (
              <div className="flex flex-col h-40 w-32 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl items-center justify-center p-4 text-center hover:border-indigo-500 transition-colors">
                <ProductImageUploader onUploaded={handleImageUploaded} />
              </div>
            )}
          </div>
          {errors.images && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {String(errors.images.message)}
            </p>
          )}
        </div>
      </div>

      {/* 4. Variant Builder & Dynamic Matrix */}
      <div className="rounded-3xl border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60 p-6 md:p-8 shadow-sm backdrop-blur-md space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100">Variant Matrix Builder</h3>
            <p className="text-xs text-slate-400">Generate and map SKUs, stock levels, and colors to specific sizes.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Sizes Selection */}
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Select Sizes
            </label>
            <div className="flex flex-wrap gap-2">
              {commonSizes.map((size) => {
                const active = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200",
                      active
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {/* Custom size input */}
            <div className="flex gap-2 max-w-xs mt-3">
              <Input
                placeholder="Custom Size (e.g. 46)"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                className="h-8 text-xs"
              />
              <Button type="button" size="sm" onClick={addCustomSize} className="h-8 text-xs bg-slate-800 text-white hover:bg-slate-900">
                Add Size
              </Button>
            </div>
          </div>

          {/* Colors Selection */}
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Select Colors
            </label>
            <div className="flex flex-wrap gap-2">
              {commonColors.map((color) => {
                const active = selectedColors.includes(color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => toggleColor(color)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200",
                      active
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                    )}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
            {/* Custom color input */}
            <div className="flex gap-2 max-w-xs mt-3">
              <Input
                placeholder="Custom Color (e.g. Mustard)"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="h-8 text-xs"
              />
              <Button type="button" size="sm" onClick={addCustomColor} className="h-8 text-xs bg-slate-800 text-white hover:bg-slate-900">
                Add Color
              </Button>
            </div>
          </div>

          {/* Matrix Action button */}
          <div className="flex justify-start">
            <Button
              type="button"
              onClick={generateVariantMatrix}
              className="gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-150 text-xs font-semibold py-2"
            >
              <Grid className="h-4 w-4" /> Generate Variant Matrix
            </Button>
          </div>

          {/* Render Matrix Grid Table */}
          {variantFields.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mt-6 bg-slate-50/50 dark:bg-slate-950/20">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Combination</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">SKU Code</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Mapped Photo</th>
                    <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {variantFields.map((field, idx) => {
                    const mappedImg = watch(`variants.${idx}.imagePublicId`);
                    return (
                      <tr key={field.id} className="hover:bg-slate-50/20">
                        {/* Combination Labels */}
                        <td className="p-3">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{watch(`variants.${idx}.size`)}</span>
                          <span className="mx-1 text-slate-400">/</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 font-medium text-slate-600 dark:text-slate-400">
                            {watch(`variants.${idx}.color`)}
                          </span>
                        </td>

                        {/* SKU */}
                        <td className="p-3">
                          <Input
                            {...register(`variants.${idx}.sku`)}
                            className="h-8 text-xs font-mono max-w-[200px]"
                          />
                        </td>

                        {/* Stock */}
                        <td className="p-3">
                          <Input
                            type="number"
                            {...register(`variants.${idx}.stock`, { valueAsNumber: true })}
                            className="h-8 text-xs w-20"
                          />
                        </td>

                        {/* Photo Selection mapping */}
                        <td className="p-3">
                          {productImages.length > 0 ? (
                            <select
                              {...register(`variants.${idx}.imagePublicId`)}
                              className="h-8 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded px-2 focus:outline-none"
                            >
                              <option value="">No photo mapped</option>
                              {productImages.map((imageId: string, pIdx: number) => (
                                <option key={imageId} value={imageId}>
                                  Photo {pIdx + 1} ({imageId.slice(-6)})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[10px] text-slate-400">Upload images first</span>
                          )}
                        </td>

                        {/* Remove Row */}
                        <td className="p-3 text-right">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => remove(idx)}
                            className="h-7 w-7 text-slate-400 hover:text-red-500 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {errors.variants && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {String(errors.variants.message)}
            </p>
          )}
        </div>
      </div>

      {/* 5. Additional Attributes */}
      <div className="rounded-3xl border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60 p-6 md:p-8 shadow-sm backdrop-blur-md space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100">Product Attributes</h3>
            <p className="text-xs text-slate-400">Provide attributes like fabric composition, cut type, or occasions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Fabric Type
            </label>
            <Input
              {...register("attributes.fabric")}
              placeholder="e.g. 100% Khadi Cotton"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Fit Type
            </label>
            <select
              {...register("attributes.fit")}
              className="w-full mt-1 h-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">Select Fit</option>
              <option value="regular">Regular</option>
              <option value="slim">Slim</option>
              <option value="relaxed">Relaxed</option>
              <option value="oversized">Oversized</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Form buttons */}
      <div className="flex justify-end gap-4">
        <Link href="/seller/products">
          <Button type="button" variant="outline" className="border-slate-200 dark:border-slate-800">
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/10 px-8"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Saving Listing...
            </div>
          ) : (
            "Save Product Listing"
          )}
        </Button>
      </div>
    </form>
  );
}

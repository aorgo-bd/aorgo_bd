"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { homepageSchema, HomepageFormData } from "@/lib/schemas";
import { getFreshIdToken } from "@/lib/firebase/client-token";
import { useUser } from "@/lib/hooks/useUser";
import toast from "react-hot-toast";
import {
  LayoutTemplate,
  Sparkles,
  Tag,
  Store,
  Eye,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
        {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-pink-600" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-[10px] text-red-500 mt-1 font-semibold">{msg}</p> : null;

const SECTION_LABELS: { key: keyof HomepageFormData["sections"]; label: string; hint: string }[] = [
  { key: "discountBanner", label: "Discount Banner", hint: "Signature gradient sale strip" },
  { key: "shopByPrice", label: "Shop by Price", hint: "Price-ceiling tiles" },
  { key: "featuredBrands", label: "Featured Brands", hint: "Brand/store spotlight cards" },
  { key: "dealOfTheDay", label: "Deal of the Day", hint: "Countdown rail" },
  { key: "newArrivals", label: "New Arrivals", hint: "Latest products rail" },
  { key: "topSelling", label: "Top Selling", hint: "Best-sellers rail" },
  { key: "allProducts", label: "All Products feed", hint: "Infinite product grid" },
];

export default function AdminHomepagePage() {
  const { isAuthenticated, isLoading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandsInput, setBrandsInput] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isDirty },
  } = useForm<HomepageFormData>({
    resolver: zodResolver(homepageSchema) as any,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "priceTiers" });
  const sections = watch("sections");

  useEffect(() => {
    if (userLoading || !isAuthenticated) return;
    let cancelled = false;

    (async () => {
      try {
        const idToken = await getFreshIdToken();
        const res = await fetch("/api/admin/homepage", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load homepage settings");
        if (!cancelled) {
          reset(data.homepage);
          setBrandsInput((data.homepage.featuredBrandSlugs || []).join(", "));
        }
      } catch (err: any) {
        if (!cancelled) toast.error(err.message || "Failed to load homepage settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userLoading, isAuthenticated, reset]);

  const onSubmit = async (data: HomepageFormData) => {
    setSaving(true);
    try {
      const idToken = await getFreshIdToken();
      const res = await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Failed to save homepage settings");
      reset(responseData.homepage);
      setBrandsInput((responseData.homepage.featuredBrandSlugs || []).join(", "));
      toast.success("Homepage updated — changes are live on the storefront");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleBrandsChange = (value: string) => {
    setBrandsInput(value);
    const slugs = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setValue("featuredBrandSlugs", slugs, { shouldDirty: true });
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">Loading homepage content...</p>
        </div>
      </div>
    );
  }

  const inputCls =
    "bg-slate-50 border-slate-200 focus:bg-white text-sm dark:bg-slate-900 dark:border-slate-800";
  const labelCls = "block text-xs font-bold text-slate-650 dark:text-slate-300 mb-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6 text-pink-500" />
            Homepage
          </h1>
          <p className="text-sm text-slate-500">
            Edit the storefront homepage content and toggle sections — no developer needed.
          </p>
        </div>
        <Button
          type="submit"
          disabled={saving || !isDirty}
          className="bg-pink-600 hover:bg-pink-700 text-white font-semibold shadow-lg shadow-pink-600/10 gap-2 rounded-xl disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discount Banner */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-pink-500" /> Discount Banner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={labelCls}>Eyebrow (small label)</label>
              <Input {...register("discountBanner.eyebrow")} className={inputCls} placeholder="Discover New Fashion" />
              <FieldError msg={errors.discountBanner?.eyebrow?.message} />
            </div>
            <div>
              <label className={labelCls}>Headline</label>
              <Input {...register("discountBanner.headline")} className={inputCls} placeholder="UP TO 70% OFF" />
              <FieldError msg={errors.discountBanner?.headline?.message} />
            </div>
            <div>
              <label className={labelCls}>Trust line</label>
              <Input {...register("discountBanner.trustLine")} className={inputCls} placeholder="Verified Sellers Only" />
              <FieldError msg={errors.discountBanner?.trustLine?.message} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Button label</label>
                <Input {...register("discountBanner.ctaLabel")} className={inputCls} placeholder="Shop the Sale" />
                <FieldError msg={errors.discountBanner?.ctaLabel?.message} />
              </div>
              <div>
                <label className={labelCls}>Link</label>
                <Input {...register("discountBanner.link")} className={inputCls} placeholder="/products?maxPrice=1999" />
                <FieldError msg={errors.discountBanner?.link?.message} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop by Price tiers */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Tag className="h-4 w-4 text-pink-500" /> Shop by Price Tiers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className={labelCls}>Label</label>
                  <Input {...register(`priceTiers.${index}.label`)} className={inputCls} placeholder="Under ৳499" />
                  <FieldError msg={errors.priceTiers?.[index]?.label?.message} />
                </div>
                <div className="w-28">
                  <label className={labelCls}>Max ৳</label>
                  <Input
                    type="number"
                    {...register(`priceTiers.${index}.maxPrice`)}
                    className={inputCls}
                    placeholder="499"
                  />
                  <FieldError msg={errors.priceTiers?.[index]?.maxPrice?.message} />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 mb-0.5 text-slate-400 hover:text-red-600 shrink-0"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {fields.length < 6 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ label: "", maxPrice: 999 })}
                className="w-full border-dashed border-slate-300 text-xs font-semibold gap-1.5 hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5" /> Add tier
              </Button>
            )}
            {typeof errors.priceTiers?.message === "string" && (
              <FieldError msg={errors.priceTiers?.message} />
            )}
          </CardContent>
        </Card>

        {/* Featured Brands */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Store className="h-4 w-4 text-pink-500" /> Featured Brands
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={labelCls}>Store slugs (comma separated, in order)</label>
              <Input
                value={brandsInput}
                onChange={(e) => handleBrandsChange(e.target.value)}
                className={inputCls}
                placeholder="aarong-heritage, yellow-clothing, sailor-fashion"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Leave empty to auto-feature the top-selling approved stores. Find a store&apos;s slug in
                its URL: <span className="font-mono">/stores/&lt;slug&gt;</span>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section visibility */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Eye className="h-4 w-4 text-pink-500" /> Section Visibility
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
            {SECTION_LABELS.map(({ key, label, hint }) => (
              <Toggle
                key={key}
                checked={!!sections?.[key]}
                onChange={(v) => setValue(`sections.${key}`, v, { shouldDirty: true })}
                label={label}
                hint={hint}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsSchema, SettingsFormData } from "@/lib/schemas";
import { getFreshIdToken } from "@/lib/firebase/client-token";
import { useUser } from "@/lib/hooks/useUser";
import toast from "react-hot-toast";
import {
  Settings as SettingsIcon,
  Megaphone,
  Truck,
  Percent,
  LifeBuoy,
  Share2,
  ShieldAlert,
  Save,
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

export default function AdminSettingsPage() {
  const { isAuthenticated, isLoading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema) as any,
  });

  const announcementActive = watch("announcementActive");
  const codEnabled = watch("codEnabled");
  const maintenanceMode = watch("maintenanceMode");

  // Load current settings once the admin session is ready.
  useEffect(() => {
    if (userLoading || !isAuthenticated) return;
    let cancelled = false;

    (async () => {
      try {
        const idToken = await getFreshIdToken();
        const res = await fetch("/api/admin/settings", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load settings");
        if (!cancelled) reset(data.settings);
      } catch (err: any) {
        if (!cancelled) toast.error(err.message || "Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userLoading, isAuthenticated, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true);
    try {
      const idToken = await getFreshIdToken();
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Failed to save settings");
      reset(responseData.settings);
      toast.success("Settings saved successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">Loading marketplace settings...</p>
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
            <SettingsIcon className="h-6 w-6 text-pink-500" />
            Marketplace Settings
          </h1>
          <p className="text-sm text-slate-500">
            Customize storefront identity, announcements, shipping defaults, and platform-wide switches.
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
        {/* Brand identity */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-pink-500" /> Brand Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={labelCls}>Site Name</label>
              <Input {...register("siteName")} className={inputCls} placeholder="AORGO" />
              <FieldError msg={errors.siteName?.message} />
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-pink-500" /> Support Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={labelCls}>Support Email</label>
              <Input {...register("supportEmail")} className={inputCls} placeholder="support@aorgo.com" />
              <FieldError msg={errors.supportEmail?.message} />
            </div>
            <div>
              <label className={labelCls}>Support Phone</label>
              <Input {...register("supportPhone")} className={inputCls} placeholder="01700000000" />
              <FieldError msg={errors.supportPhone?.message} />
            </div>
          </CardContent>
        </Card>

        {/* Announcement */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-pink-500" /> Announcement Bar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={labelCls}>Message</label>
              <Input
                {...register("announcement")}
                className={inputCls}
                placeholder="🎉 Free delivery on orders over ৳2000!"
              />
              <FieldError msg={errors.announcement?.message} />
            </div>
            <Toggle
              checked={!!announcementActive}
              onChange={(v) => setValue("announcementActive", v, { shouldDirty: true })}
              label="Show announcement bar"
              hint="Displays across the top of the storefront"
            />
          </CardContent>
        </Card>

        {/* Shipping & commission */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Truck className="h-4 w-4 text-pink-500" /> Shipping & Commission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Default Shipping Fee (৳)</label>
                <Input type="number" {...register("defaultShippingFee")} className={inputCls} placeholder="60" />
                <FieldError msg={errors.defaultShippingFee?.message} />
              </div>
              <div>
                <label className={labelCls}>Free Shipping Over (৳)</label>
                <Input type="number" {...register("freeShippingThreshold")} className={inputCls} placeholder="0 = off" />
                <FieldError msg={errors.freeShippingThreshold?.message} />
              </div>
            </div>
            <div>
              <label className={labelCls}>
                <Percent className="inline h-3 w-3 mr-1" />
                Default Commission Rate (%)
              </label>
              <Input type="number" step="0.5" {...register("defaultCommissionRate")} className={inputCls} placeholder="10" />
              <FieldError msg={errors.defaultCommissionRate?.message} />
            </div>
          </CardContent>
        </Card>

        {/* Social */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Share2 className="h-4 w-4 text-pink-500" /> Social Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={labelCls}>Facebook URL</label>
              <Input {...register("socialFacebook")} className={inputCls} placeholder="https://facebook.com/aorgo" />
              <FieldError msg={errors.socialFacebook?.message} />
            </div>
            <div>
              <label className={labelCls}>Instagram URL</label>
              <Input {...register("socialInstagram")} className={inputCls} placeholder="https://instagram.com/aorgo" />
              <FieldError msg={errors.socialInstagram?.message} />
            </div>
          </CardContent>
        </Card>

        {/* Platform switches */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-pink-500" /> Platform Switches
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
            <Toggle
              checked={!!codEnabled}
              onChange={(v) => setValue("codEnabled", v, { shouldDirty: true })}
              label="Cash on Delivery"
              hint="Allow customers to pay on delivery"
            />
            <Toggle
              checked={!!maintenanceMode}
              onChange={(v) => setValue("maintenanceMode", v, { shouldDirty: true })}
              label="Maintenance mode"
              hint="Show a maintenance notice on the storefront"
            />
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

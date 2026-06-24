"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, AddressFormData } from "@/lib/schemas";
import { bdDistricts } from "@/lib/data/bd-districts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => void;
  defaultValues?: Partial<AddressFormData>;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}

export function AddressForm({
  onSubmit,
  defaultValues,
  isSubmitting = false,
  submitLabel = "Save Address",
  cancelLabel = "Cancel",
  onCancel,
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "",
      phone: "",
      area: "",
      city: "",
      district: "",
      postalCode: "",
      isDefault: false,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Full Name *
          </label>
          <Input
            type="text"
            placeholder="e.g. Adnan Rahman"
            {...register("name")}
            className={errors.name ? "border-destructive focus-visible:ring-destructive/20" : ""}
          />
          {errors.name && (
            <p className="text-[11px] text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Mobile Number (Bangladesh) *
          </label>
          <Input
            type="tel"
            placeholder="e.g. 01712345678"
            {...register("phone")}
            className={errors.phone ? "border-destructive focus-visible:ring-destructive/20" : ""}
          />
          {errors.phone && (
            <p className="text-[11px] text-destructive mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Area Address */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Area / Street Address *
        </label>
        <textarea
          rows={3}
          placeholder="e.g. House 42, Road 11, Banani"
          {...register("area")}
          className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] dark:bg-input/30"
        />
        {errors.area && (
          <p className="text-[11px] text-destructive mt-1">{errors.area.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* City */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            City *
          </label>
          <Input
            type="text"
            placeholder="e.g. Dhaka"
            {...register("city")}
            className={errors.city ? "border-destructive focus-visible:ring-destructive/20" : ""}
          />
          {errors.city && (
            <p className="text-[11px] text-destructive mt-1">{errors.city.message}</p>
          )}
        </div>

        {/* District */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            District *
          </label>
          <select
            {...register("district")}
            className="flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
          >
            <option value="" className="text-muted-foreground dark:bg-zinc-900">
              Select District
            </option>
            {bdDistricts.map((district) => (
              <option key={district} value={district} className="dark:bg-zinc-900">
                {district}
              </option>
            ))}
          </select>
          {errors.district && (
            <p className="text-[11px] text-destructive mt-1">{errors.district.message}</p>
          )}
        </div>

        {/* Postal Code */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Postal Code *
          </label>
          <Input
            type="text"
            placeholder="e.g. 1213"
            {...register("postalCode")}
            className={errors.postalCode ? "border-destructive focus-visible:ring-destructive/20" : ""}
          />
          {errors.postalCode && (
            <p className="text-[11px] text-destructive mt-1">{errors.postalCode.message}</p>
          )}
        </div>
      </div>

      {/* Set Default Checkbox */}
      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="isDefault"
          {...register("isDefault")}
          className="h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-2"
        />
        <label htmlFor="isDefault" className="text-sm font-medium leading-none cursor-pointer">
          Set as default shipping address
        </label>
      </div>

      {/* Form Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

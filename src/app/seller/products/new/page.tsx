"use client";

import React, { useState } from "react";
import { ProductForm } from "@/components/seller/ProductForm";
import { ProductFormData } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import { toast } from "sonner";
import { PackagePlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to create product listing");
      }

      toast.success(result.message || "Product listing created successfully!");
      router.push("/seller/products");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/seller/products">
          <Button variant="ghost" size="icon" className="h-9 w-9 border border-slate-200 dark:border-slate-800">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <PackagePlus className="h-6 w-6 text-indigo-500" /> Add New Product
          </h1>
          <p className="text-sm text-slate-500">
            Create a new apparel or footwear listing with custom variants for the marketplace.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <ProductForm isSubmitting={isSubmitting} onSubmit={handleSubmit} />
    </div>
  );
}

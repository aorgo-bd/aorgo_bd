"use client";

import React, { useState } from "react";
import { ProductForm } from "@/components/seller/ProductForm";
import { ProductFormData } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import { useSellerProduct } from "@/lib/hooks/useProducts";
import { toast } from "sonner";
import { Edit, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter();
  const productId = params.id;
  const { user } = useUser();
  
  // Query product data
  const { data: product, isLoading: isProductLoading, error } = useSellerProduct(productId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update product listing");
      }

      toast.success(result.message || "Product listing updated successfully!");
      router.push("/seller/products");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProductLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <p className="text-slate-500 mt-2">The product you are trying to edit does not exist or you do not have permission to view it.</p>
        <Link href="/seller/products" className="mt-4 inline-block">
          <Button>Back to Catalog</Button>
        </Link>
      </div>
    );
  }

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
            <Edit className="h-6 w-6 text-indigo-500" /> Edit Product Listing
          </h1>
          <p className="text-sm text-slate-500">
            Update pricing, variants or basic details. Changing price, title or photos resets approval status.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <ProductForm
        initialData={product}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

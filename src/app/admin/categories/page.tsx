"use client";

import React, { useState, useMemo } from "react";
import { useCategories } from "@/lib/hooks/useCategories";
import { Category } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categoryFormSchema, CategoryFormData } from "@/lib/schemas";
import { CldUploadWidget } from "next-cloudinary";
import toast from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Layers, Plus, Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getFreshIdToken } from "@/lib/firebase/client-token";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading, refetch } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  // Whether the admin has manually edited the slug (stops auto-derivation).
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      nameBn: "",
      parent: "",
      image: "",
      order: 0,
    },
  });

  const nameValue = watch("name");
  const imageValue = watch("image");

  // Top-level categories are the only valid parents.
  const parentOptions = useMemo(
    () => categories.filter((c: Category) => !c.parent),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return categories.filter((c: Category) => {
      const nameMatch = c.name?.toLowerCase().includes(q);
      const slugMatch = c.slug?.toLowerCase().includes(q);
      const parentMatch = c.parent?.toLowerCase().includes(q);
      return nameMatch || slugMatch || parentMatch;
    });
  }, [categories, searchTerm]);

  const handleCreateOpen = () => {
    setEditingCategory(null);
    setSlugTouched(false);
    reset({
      name: "",
      slug: "",
      nameBn: "",
      parent: "",
      image: "",
      order: categories.length,
    });
    setIsFormOpen(true);
  };

  const handleEditOpen = (category: Category) => {
    setEditingCategory(category);
    setSlugTouched(true); // slug is locked when editing
    reset({
      name: category.name || "",
      slug: category.slug || "",
      nameBn: category.nameBn || "",
      parent: category.parent || "",
      image: category.image || "",
      order: category.order ?? 0,
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data: CategoryFormData) => {
    setSubmitLoading(true);
    try {
      const idToken = await getFreshIdToken();
      const method = editingCategory ? "PUT" : "POST";
      const res = await fetch("/api/admin/categories", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || "Failed to save category");
      }

      toast.success(editingCategory ? "Category updated successfully!" : "New category created!");
      setIsFormOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (
      !confirm(
        `Delete category "${category.name}"? This cannot be undone.`
      )
    )
      return;
    setDeletingSlug(category.slug);
    try {
      const idToken = await getFreshIdToken();
      const res = await fetch(`/api/admin/categories?slug=${encodeURIComponent(category.slug)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || "Failed to delete category");
      }
      toast.success("Category deleted");
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setDeletingSlug(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Product Categories
          </h1>
          <p className="text-sm text-slate-500">
            Create, edit, and organise the catalog taxonomy and its hierarchy.
          </p>
        </div>
        <Button
          onClick={handleCreateOpen}
          className="bg-pink-600 hover:bg-pink-700 text-white font-semibold shadow-lg shadow-pink-600/10 gap-2 rounded-xl"
        >
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Filters */}
      <div className="relative max-w-md bg-white/60 dark:bg-slate-950/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search categories by name, slug, parent..."
          className="pl-10 bg-slate-50 border-transparent focus:bg-white transition-colors text-sm"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">Loading catalog taxonomy...</p>
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="font-bold text-xs py-4">Name</TableHead>
                <TableHead className="font-bold text-xs">Bangla name</TableHead>
                <TableHead className="font-bold text-xs">Slug ID</TableHead>
                <TableHead className="font-bold text-xs">Parent hierarchy</TableHead>
                <TableHead className="font-bold text-xs">Display order</TableHead>
                <TableHead className="font-bold text-xs text-right">Products</TableHead>
                <TableHead className="font-bold text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-150 dark:divide-slate-800">
              {filteredCategories.map((c: Category) => (
                <TableRow key={c.slug} className="hover:bg-slate-50/30 transition-colors">
                  <TableCell className="py-4 font-bold text-slate-800 dark:text-slate-100">
                    {c.name}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-semibold text-slate-550">
                    {c.nameBn || "—"}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-mono text-slate-500">{c.slug}</TableCell>
                  <TableCell className="py-4 text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
                    {c.parent ? c.parent.replace(/-/g, " ") : "Top-level"}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-semibold text-slate-650">
                    Slot {c.order}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-black text-slate-700 dark:text-slate-200 text-right">
                    {c.productCount ?? 0}
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-500 hover:text-pink-600"
                        onClick={() => handleEditOpen(c)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-500 hover:text-red-600"
                        disabled={deletingSlug === c.slug}
                        onClick={() => handleDelete(c)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <Layers className="h-10 w-10 mx-auto mb-2 text-slate-350 dark:text-slate-800" />
          <p className="font-semibold text-slate-700 dark:text-slate-350">No categories found</p>
          <p className="text-xs text-slate-400">
            {categories.length === 0 ? "Add your first category using the button above." : "Try modifying search inputs."}
          </p>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && setIsFormOpen(false)}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6 border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-pink-500" />
              {editingCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Set the display name, URL slug, parent hierarchy and sort order.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1">Name</label>
              <Input
                {...register("name")}
                onChange={(e) => {
                  setValue("name", e.target.value, { shouldValidate: true });
                  if (!editingCategory && !slugTouched) {
                    setValue("slug", slugify(e.target.value), { shouldValidate: true });
                  }
                }}
                placeholder="e.g. Women's Tops"
                className="bg-slate-50 border-slate-200 focus:bg-white text-sm"
              />
              {errors.name && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.name.message}</p>}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1">
                Slug ID {editingCategory && <span className="font-normal text-slate-400">(cannot be changed)</span>}
              </label>
              <Input
                {...register("slug")}
                onChange={(e) => {
                  setSlugTouched(true);
                  setValue("slug", e.target.value, { shouldValidate: true });
                }}
                disabled={!!editingCategory}
                placeholder="e.g. women-tops"
                className="bg-slate-50 border-slate-200 focus:bg-white text-sm font-mono disabled:opacity-60 disabled:cursor-not-allowed"
              />
              {errors.slug && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.slug.message}</p>}
            </div>

            {/* Bangla name + Order */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1">Bangla name (optional)</label>
                <Input
                  {...register("nameBn")}
                  placeholder="e.g. নারীর টপস"
                  className="bg-slate-50 border-slate-200 focus:bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1">Display order</label>
                <Input
                  type="number"
                  {...register("order")}
                  placeholder="0"
                  className="bg-slate-50 border-slate-200 focus:bg-white text-sm"
                />
                {errors.order && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.order.message}</p>}
              </div>
            </div>

            {/* Parent */}
            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1">Parent category</label>
              <select
                {...register("parent")}
                className="w-full h-10 border border-slate-200 bg-slate-50 rounded-lg px-3 text-sm font-medium text-slate-700 focus:outline-none focus:bg-white"
              >
                <option value="">Top-level (no parent)</option>
                {parentOptions
                  .filter((p: Category) => p.slug !== editingCategory?.slug)
                  .map((p: Category) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
              </select>
              {errors.parent && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.parent.message as string}</p>}
            </div>

            {/* Image (optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-650 mb-1">Image (optional)</label>
              <div className="flex items-center gap-3">
                <CldUploadWidget
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                  options={{ multiple: false, maxFiles: 1, sources: ["local", "url"] }}
                  onSuccess={(res) =>
                    setValue("image", (res.info as any).public_id, { shouldValidate: true })
                  }
                >
                  {({ open }) => (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => open()}
                      className="border-slate-200 text-xs font-semibold hover:bg-slate-50"
                    >
                      {imageValue ? "Replace Image" : "Upload Image"}
                    </Button>
                  )}
                </CldUploadWidget>
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                  {imageValue || "No image"}
                </span>
                {imageValue && (
                  <button
                    type="button"
                    onClick={() => setValue("image", "", { shouldValidate: true })}
                    className="text-[10px] font-semibold text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input type="hidden" {...register("image")} />
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
                className="rounded-lg text-xs font-semibold bg-pink-600 hover:bg-pink-700 text-white"
              >
                {submitLoading ? "Saving..." : editingCategory ? "Save Changes" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

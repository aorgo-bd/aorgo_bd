"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sellerRegisterSchema, SellerRegisterFormData } from "@/lib/schemas";
import { useUser } from "@/lib/hooks/useUser";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Cloudinary unsigned upload for seller verification documents.
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
}

async function uploadToCloudinary(
  file: File,
  folder: string,
  onProgress: (pct: number) => void
): Promise<CloudinaryUploadResult> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary env vars missing (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)");
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  form.append("folder", folder);

  return await new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            publicId: data.public_id as string,
            secureUrl: data.secure_url as string,
          });
        } catch {
          reject(new Error("Invalid Cloudinary response"));
        }
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(form);
  });
}
import {
  Store,
  Upload,
  FileCheck,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Building2,
  FileText,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { cloudinaryDocumentUrl } from "@/lib/cloudinary";

export default function SellerRegisterPage() {
  const { user, firebaseUser, refetch, role } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (role === "seller" || role === "admin") {
      router.replace("/seller/dashboard");
    }
  }, [role, router]);

  // File upload state
  const [licenseUploading, setLicenseUploading] = useState(false);
  const [licenseProgress, setLicenseProgress] = useState(0);
  const [nidUploading, setNidUploading] = useState(false);
  const [nidProgress, setNidProgress] = useState(0);
  const [licensePreviewUrl, setLicensePreviewUrl] = useState<string | null>(null);
  const [nidPreviewUrl, setNidPreviewUrl] = useState<string | null>(null);

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    trigger,
    formState: { errors },
  } = useForm<SellerRegisterFormData>({
    resolver: zodResolver(sellerRegisterSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      contactEmail: user?.email || "",
      contactPhone: "",
      tradeLicenseUrl: "",
      nidUrl: "",
      bankDetails: {
        accountName: "",
        accountNumber: "",
        bankName: "",
        branchName: "",
        routingNumber: "",
      },
    },
  });

  const storeName = watch("name");
  const tradeLicenseUrl = watch("tradeLicenseUrl");
  const nidUrl = watch("nidUrl");

  // Auto-slugify store name
  useEffect(() => {
    if (storeName) {
      const slug = storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setValue("slug", slug, { shouldValidate: true });
    }
  }, [storeName, setValue]);

  // Set email when user becomes available
  useEffect(() => {
    if (user?.email) {
      setValue("contactEmail", user.email);
    }
  }, [user, setValue]);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "tradeLicense" | "nid"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type (PDFs and Images only)
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a PDF, JPG, or PNG file.");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    const setUploading = type === "tradeLicense" ? setLicenseUploading : setNidUploading;
    const setProgress = type === "tradeLicense" ? setLicenseProgress : setNidProgress;
    const fieldName = type === "tradeLicense" ? "tradeLicenseUrl" : "nidUrl";

    setUploading(true);
    setProgress(0);

    try {
      const folder = `seller-docs/${user.uid}`;
      const uploadResult = await uploadToCloudinary(file, folder, setProgress);
      setValue(fieldName, uploadResult.publicId, { shouldValidate: true });
      if (type === "tradeLicense") {
        setLicensePreviewUrl(uploadResult.secureUrl);
      } else {
        setNidPreviewUrl(uploadResult.secureUrl);
      }
      toast.success(`${type === "tradeLicense" ? "Trade License" : "NID"} uploaded successfully!`);
      setUploading(false);
    } catch (err: any) {
      console.error(err);
      toast.error("File upload failed: " + err.message);
      setUploading(false);
    }
  };

  // Step Validation logic
  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 0) {
      fieldsToValidate = ["name", "slug", "description", "contactEmail", "contactPhone"];
    } else if (currentStep === 1) {
      fieldsToValidate = ["tradeLicenseUrl", "nidUrl"];
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setCurrentStep((prev) => prev + 1);
    } else {
      toast.error("Please fill in all required fields correctly before proceeding.");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = async (formData: SellerRegisterFormData) => {
    setIsSubmitting(true);
    try {
      const idToken = await firebaseUser?.getIdToken();
      const res = await fetch("/api/seller/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to submit application");
      }

      const refreshedToken = await firebaseUser?.getIdToken(true);
      if (refreshedToken) {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: refreshedToken }),
        });
      }

      toast.success(result.message || "Registration submitted!");
      await refetch(); // Reload user context to sync role
      router.push("/seller/dashboard");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { title: "Store Info", icon: Store },
    { title: "Documents", icon: FileText },
    { title: "Bank Details", icon: CreditCard },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center p-4 py-12 md:p-8">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-white/60 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60 md:p-10">
        {/* Progress Bar & Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-pink-600 to-pink-700 bg-clip-text text-transparent dark:from-pink-400 dark:to-pink-400">
            Apply as Seller Partner
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Start selling your products on AORGO marketplace
          </p>

          {/* Stepper Visual */}
          <div className="relative mt-8 flex items-center justify-between">
            {/* Step lines */}
            <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-slate-200 dark:bg-slate-800 -z-10" />
            <div
              className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-pink-600 transition-all duration-300 -z-10"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = currentStep > idx;
              const isCurrent = currentStep === idx;

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 font-semibold text-sm",
                      isCompleted
                        ? "bg-pink-600 border-pink-600 text-white"
                        : isCurrent
                        ? "bg-white dark:bg-slate-900 border-pink-600 text-pink-600 shadow-md shadow-pink-600/10 scale-110"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                    )}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold tracking-wider uppercase",
                      isCurrent
                        ? "text-pink-600 dark:text-pink-400"
                        : "text-slate-400 dark:text-slate-600"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Wizard Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Store Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register("name")}
                    placeholder="e.g. Fab Bangladesh"
                    className="mt-1"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Store Slug <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register("slug")}
                    placeholder="fab-bangladesh"
                    className="mt-1 font-mono text-sm bg-slate-50 dark:bg-slate-900/50"
                  />
                  <p className="text-[10px] mt-0.5 text-slate-400">
                    This is your store&apos;s public web address: aorgo.com/store/{watch("slug") || "your-slug"}
                  </p>
                  {errors.slug && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.slug.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Store Description <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    {...register("description")}
                    placeholder="Describe your brand, fashion catalog, craft techniques, and style direction..."
                    className="mt-1 h-28 resize-none leading-relaxed"
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Contact Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      {...register("contactEmail")}
                      type="email"
                      className="mt-1"
                    />
                    {errors.contactEmail && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.contactEmail.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Contact Phone <span className="text-red-500">*</span>
                    </label>
                    <Input
                      {...register("contactPhone")}
                      placeholder="e.g. 01712345678"
                      className="mt-1"
                    />
                    {errors.contactPhone && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.contactPhone.message}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Trade License Upload */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Trade License Document <span className="text-red-500">*</span>
                  </label>
                  <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-pink-500 transition-colors">
                    <input
                      type="file"
                      id="trade-license-input"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => handleFileUpload(e, "tradeLicense")}
                      disabled={licenseUploading}
                    />
                    {tradeLicenseUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-green-50 dark:bg-green-950/20 flex items-center justify-center text-green-600">
                          <FileCheck className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Trade License Uploaded</p>
                        <a
                          href={licensePreviewUrl ?? cloudinaryDocumentUrl(tradeLicenseUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-pink-600 dark:text-pink-400 underline font-semibold mt-1"
                        >
                          View Document
                        </a>
                      </div>
                    ) : licenseUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 text-pink-600 animate-spin" />
                        <p className="text-sm font-medium">Uploading Trade License... {licenseProgress}%</p>
                        <div className="w-full max-w-[200px] h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-pink-600 rounded-full" style={{ width: `${licenseProgress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-slate-400" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Drag and drop or click to upload
                        </p>
                        <p className="text-xs text-slate-400">PDF, JPG, or PNG up to 5MB</p>
                      </div>
                    )}
                  </div>
                  {errors.tradeLicenseUrl && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.tradeLicenseUrl.message}
                    </p>
                  )}
                </div>

                {/* NID Upload */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    National ID Card (NID) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-pink-500 transition-colors">
                    <input
                      type="file"
                      id="nid-input"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => handleFileUpload(e, "nid")}
                      disabled={nidUploading}
                    />
                    {nidUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-green-50 dark:bg-green-950/20 flex items-center justify-center text-green-600">
                          <FileCheck className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">National ID Uploaded</p>
                        <a
                          href={nidPreviewUrl ?? cloudinaryDocumentUrl(nidUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-pink-600 dark:text-pink-400 underline font-semibold mt-1"
                        >
                          View Document
                        </a>
                      </div>
                    ) : nidUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 text-pink-600 animate-spin" />
                        <p className="text-sm font-medium">Uploading National ID... {nidProgress}%</p>
                        <div className="w-full max-w-[200px] h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-pink-600 rounded-full" style={{ width: `${nidProgress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-slate-400" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Drag and drop or click to upload
                        </p>
                        <p className="text-xs text-slate-400">PDF, JPG, or PNG up to 5MB</p>
                      </div>
                    )}
                  </div>
                  {errors.nidUrl && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.nidUrl.message}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/50 rounded-2xl p-4 mb-4">
                  <Building2 className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Please provide the bank details where you wish to receive your payouts after commissions.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register("bankDetails.accountName")}
                    placeholder="Full name as appears on bank account"
                    className="mt-1"
                  />
                  {errors.bankDetails?.accountName && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.bankDetails.accountName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register("bankDetails.accountNumber")}
                    placeholder="e.g. 1029384756"
                    className="mt-1 font-mono"
                  />
                  {errors.bankDetails?.accountNumber && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.bankDetails.accountNumber.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      {...register("bankDetails.bankName")}
                      placeholder="e.g. Dutch Bangla Bank"
                      className="mt-1"
                    />
                    {errors.bankDetails?.bankName && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.bankDetails.bankName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Branch Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      {...register("bankDetails.branchName")}
                      placeholder="e.g. Banani Branch"
                      className="mt-1"
                    />
                    {errors.bankDetails?.branchName && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.bankDetails.branchName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Routing Number <span className="text-slate-400">(Optional)</span>
                  </label>
                  <Input
                    {...register("bankDetails.routingNumber")}
                    placeholder="e.g. 095262299"
                    className="mt-1 font-mono"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
            {currentStep > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="gap-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold transition-all duration-200"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting || licenseUploading || nidUploading}
                className="gap-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold shadow-lg shadow-pink-600/10 transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting Application...
                  </>
                ) : (
                  <>
                    Submit Application <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

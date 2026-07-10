"use client";

import { useUser } from "@/lib/hooks/useUser";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { sendPasswordResetEmail } from "firebase/auth";
import toast from "react-hot-toast";
import { ShieldAlert, KeyRound, User as UserIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { profileSettingsSchema, ProfileSettingsFormData } from "@/lib/schemas";

export default function AccountSettingsPage() {
  const { user, refetch } = useUser();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileSettingsFormData>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: { displayName: "", phone: "", photoURL: "" },
  });

  // Populate form once the user document has loaded.
  useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName || "",
        phone: user.phone || "",
        photoURL: user.photoURL || "",
      });
    }
  }, [user, reset]);

  const handleUpdateProfile = async (data: ProfileSettingsFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: data.displayName,
        phone: data.phone,
        photoURL: data.photoURL,
        updatedAt: Date.now(),
      });
      toast.success("Profile updated successfully!");
      await refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerReset = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setResetLoading(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!user) return;
    if (
      !confirm(
        "Are you sure you want to deactivate your account? This action is soft-deactivated and you will be signed out."
      )
    ) {
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        deletedAt: Date.now(),
        updatedAt: Date.now(),
      });
      toast.success("Account deactivated successfully.");
      // Sign out
      await auth.signOut();
      document.cookie = "firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err.message || "Deactivation failed.");
    }
  };

  return (
    <div className="space-y-8 max-w-xl">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
        <Link href="/profile" className="text-gray-400 hover:text-black lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-black">Account Settings</h1>
          <p className="text-xs text-gray-500 font-medium">Update password, contact details, and account preferences</p>
        </div>
      </div>

      {/* Edit Profile Form */}
      <form onSubmit={handleSubmit(handleUpdateProfile)} className="space-y-4" noValidate>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
          <UserIcon className="h-4.5 w-4.5 text-gray-450" />
          <span>Profile Information</span>
        </h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="displayName" className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Full Name</label>
            <input
              id="displayName"
              type="text"
              {...register("displayName")}
              placeholder="Your full name"
              className="w-full h-10 px-3.5 rounded-xl border border-gray-250 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            {errors.displayName && (
              <p className="text-[11px] text-red-600">{errors.displayName.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Email Address (Read-only)</label>
            <input
              id="email"
              type="email"
              disabled
              value={user?.email || ""}
              readOnly
              className="w-full h-10 px-3.5 rounded-xl border border-gray-150 bg-slate-50 text-gray-450 text-sm focus:outline-none select-none"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="phone" className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Phone Number</label>
            <input
              id="phone"
              type="tel"
              {...register("phone")}
              placeholder="e.g. 01712345678"
              className="w-full h-10 px-3.5 rounded-xl border border-gray-250 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            {errors.phone && (
              <p className="text-[11px] text-red-600">{errors.phone.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="photoURL" className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Avatar Photo URL</label>
            <input
              id="photoURL"
              type="text"
              {...register("photoURL")}
              placeholder="Cloudinary public URL or external image..."
              className="w-full h-10 px-3.5 rounded-xl border border-gray-250 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            {errors.photoURL && (
              <p className="text-[11px] text-red-600">{errors.photoURL.message}</p>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 items-center justify-center bg-black hover:bg-black/90 text-white rounded-xl px-5 text-xs font-bold transition-all disabled:opacity-50 min-w-[100px] cursor-pointer"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>

      <hr className="border-t border-gray-100" />

      {/* Security Actions */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
          <KeyRound className="h-4.5 w-4.5 text-gray-450" />
          <span>Security & Authentication</span>
        </h3>
        <div className="p-4 bg-slate-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-gray-800">Password Update</p>
            <p className="text-xs text-gray-500 mt-0.5">Send a secure link to reset your account password.</p>
          </div>
          <button
            onClick={handleTriggerReset}
            disabled={resetLoading}
            className="inline-flex h-9 items-center justify-center border border-gray-200 hover:border-black rounded-lg px-4 text-xs font-bold text-gray-700 hover:text-black transition-all bg-white whitespace-nowrap active:scale-98"
          >
            {resetLoading ? "Sending Link..." : "Reset Password"}
          </button>
        </div>
      </div>

      <hr className="border-t border-gray-100" />

      {/* Account Deactivation */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 text-red-600">
          <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
          <span>Danger Zone</span>
        </h3>
        <div className="p-5 bg-red-50/30 border border-red-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-red-800">Deactivate Account</p>
            <p className="text-xs text-red-600/70 mt-0.5 leading-relaxed">
              This will log you out, clear active sessions, and label your profile as soft-deleted in our records.
            </p>
          </div>
          <button
            onClick={handleSoftDelete}
            className="inline-flex h-9 items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs hover:shadow-sm active:scale-98"
          >
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}

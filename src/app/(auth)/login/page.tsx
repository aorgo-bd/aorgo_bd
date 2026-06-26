"use client";

import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { createOrGetUserDocument } from "@/lib/firebase/auth-helpers";
import { loginSchema, LoginFormData } from "@/lib/schemas";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FaEye, FaEyeSlash, FaFacebook, FaGoogle } from "react-icons/fa";
import { useUser } from "@/lib/hooks/useUser";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Role } from "@/lib/types";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const [loginLoading, setLoginLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  // Check if already authenticated and redirect
  const { isAuthenticated, isLoading, role } = useUser();
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const target =
        role === "admin" ? "/admin/dashboard" :
        role === "seller" ? "/seller/dashboard" :
        redirectPath;
      router.push(target);
    }
  }, [isAuthenticated, isLoading, role, redirectPath, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoginLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // 1. Force-refresh the ID token
      const idToken = await user.getIdToken(true);
      document.cookie = `firebase-token=${idToken}; path=/; max-age=3600; SameSite=Lax`;

      // 2. Fetch user doc to read role
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const roleVal = userSnap.exists() ? (userSnap.data().role as Role) : "customer";
      document.cookie = `user-role=${roleVal}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      // 3. Ensure user doc exists
      await createOrGetUserDocument(user);

      toast.success("Successfully logged in!");

      // 4. Role-aware redirect
      const target =
        roleVal === "admin" ? "/admin/dashboard" :
        roleVal === "seller" ? "/seller/dashboard" :
        (redirectPath || "/");
      router.push(target);
    } catch (error: any) {
      console.error(error);
      let errorMsg = "Failed to log in. Please check your credentials.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMsg = "Invalid email or password.";
      } else if (error.code === "auth/too-many-requests") {
        errorMsg = "Too many login attempts. Please try again later.";
      }
      toast.error(errorMsg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);

      // 1. Force-refresh the ID token
      const idToken = await user.getIdToken(true);
      document.cookie = `firebase-token=${idToken}; path=/; max-age=3600; SameSite=Lax`;

      // 2. Fetch user doc to read role
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const roleVal = userSnap.exists() ? (userSnap.data().role as Role) : "customer";
      document.cookie = `user-role=${roleVal}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      await createOrGetUserDocument(user);

      toast.success("Successfully signed in with Google!");

      // 3. Role-aware redirect
      const target =
        roleVal === "admin" ? "/admin/dashboard" :
        roleVal === "seller" ? "/seller/dashboard" :
        (redirectPath || "/");
      router.push(target);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Google login failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setFacebookLoading(true);
    try {
      const provider = new FacebookAuthProvider();
      const { user } = await signInWithPopup(auth, provider);

      // 1. Force-refresh the ID token
      const idToken = await user.getIdToken(true);
      document.cookie = `firebase-token=${idToken}; path=/; max-age=3600; SameSite=Lax`;

      // 2. Fetch user doc to read role
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const roleVal = userSnap.exists() ? (userSnap.data().role as Role) : "customer";
      document.cookie = `user-role=${roleVal}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      await createOrGetUserDocument(user);

      toast.success("Successfully signed in with Facebook!");

      // 3. Role-aware redirect
      const target =
        roleVal === "admin" ? "/admin/dashboard" :
        roleVal === "seller" ? "/seller/dashboard" :
        (redirectPath || "/");
      router.push(target);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Facebook login failed.");
    } finally {
      setFacebookLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Password reset email sent!");
      setIsResetMode(false);
      setResetEmail("");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  const isAnyLoading = loginLoading || googleLoading || facebookLoading || resetLoading;

  if (isResetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-gray-150/50">
          <div>
            <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handlePasswordReset}>
            <div>
              <label htmlFor="reset-email" className="block text-sm font-semibold text-gray-750 mb-1">
                Email address
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                placeholder="email@example.com"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50"
              >
                {resetLoading ? "Sending..." : "Send Reset Email"}
              </button>
              <button
                type="button"
                onClick={() => setIsResetMode(false)}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-gray-150/50">
        <div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
            >
              create a new account
            </Link>
          </p>
        </div>

        {redirectPath.startsWith("/seller") && (
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 text-sm text-indigo-800">
            🛍️ <strong>Seller login</strong> — your credentials are the same as your customer account.
            New here? <Link href="/seller/register" className="underline font-semibold">Register as a Seller</Link>
          </div>
        )}
        {redirectPath.startsWith("/admin") && (
          <div className="rounded-lg bg-violet-50 border border-violet-100 px-4 py-3 text-sm text-violet-800">
            🛡️ <strong>Admin login</strong> — restricted access only.
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-750 mb-1">
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-750 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 pr-10 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                onClick={() => setIsResetMode(true)}
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isAnyLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-all duration-250 disabled:opacity-50 transform active:scale-98"
            >
              {loginLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white/70 backdrop-blur-md rounded-md text-gray-500 font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isAnyLoading}
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all duration-200 disabled:opacity-50"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-t-2 border-gray-400 border-solid rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FaGoogle className="h-5 w-5 text-red-500 mr-2" />
                    <span>Google</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleFacebookLogin}
                disabled={isAnyLoading}
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all duration-200 disabled:opacity-50"
              >
                {facebookLoading ? (
                  <div className="w-4 h-4 border-t-2 border-gray-400 border-solid rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FaFacebook className="h-5 w-5 text-blue-600 mr-2" />
                    <span>Facebook</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

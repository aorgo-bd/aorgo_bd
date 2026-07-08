"use client";

import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  sendEmailVerification,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { createOrGetUserDocument } from "@/lib/firebase/auth-helpers";
import { registerSchema, RegisterFormData } from "@/lib/schemas";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash, FaFacebook, FaGoogle } from "react-icons/fa";
import { useUser } from "@/lib/hooks/useUser";
import { Role } from "@/lib/types";

function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [registerLoading, setRegisterLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  const safeRedirectPath = redirectPath.startsWith("/") && !redirectPath.startsWith("//") ? redirectPath : "/";

  // Check if already authenticated and redirect
  const { isAuthenticated, isLoading } = useUser();
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push(safeRedirectPath);
    }
  }, [isAuthenticated, isLoading, safeRedirectPath, router]);

  const createServerSession = async (user: FirebaseUser): Promise<Role> => {
    const idToken = await user.getIdToken(true);
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Failed to create a secure session.");
    }

    return (payload.role || "customer") as Role;
  };
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setRegisterLoading(true);
    try {
      const displayName = `${data.firstName} ${data.lastName}`;
      
      const { user } = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Update Firebase Auth profile
      await updateProfile(user, { displayName });

      // Create user document in Firestore with role='customer' by default
      await createOrGetUserDocument(user, { displayName });
      await createServerSession(user);

      try {
        await sendEmailVerification(user);
        setIsVerificationSent(true);
        toast.success("Successfully registered account! Verification email sent.");
      } catch (emailError: any) {
        console.error("Error sending verification email:", emailError);
        toast.success("Account registered, but failed to send verification email automatically.");
        router.push(safeRedirectPath);
      }
    } catch (error: any) {
      console.error(error);
      let errorMsg = "Registration failed. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMsg = "An account already exists with this email address.";
      } else if (error.code === "auth/weak-password") {
        errorMsg = "The password is too weak.";
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "The email address is invalid.";
      }
      toast.error(errorMsg);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);

      // Create user document in Firestore if not existing (default role 'customer')
      await createOrGetUserDocument(user);
      await createServerSession(user);

      toast.success("Successfully signed up with Google!");
      router.push(safeRedirectPath);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Google signup failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookSignup = async () => {
    setFacebookLoading(true);
    try {
      const provider = new FacebookAuthProvider();
      const { user } = await signInWithPopup(auth, provider);

      // Create user document in Firestore if not existing (default role 'customer')
      await createOrGetUserDocument(user);
      await createServerSession(user);

      toast.success("Successfully signed up with Facebook!");
      router.push(safeRedirectPath);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Facebook signup failed.");
    } finally {
      setFacebookLoading(false);
    }
  };

  const isAnyLoading = registerLoading || googleLoading || facebookLoading;

  if (isVerificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-gray-150/50 text-center animate-fade-in">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-pink-100">
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-650">
            We&apos;ve sent a verification link to your email address. Please check your inbox and click the link to activate your account.
          </p>
          <div className="mt-6 flex flex-col space-y-4">
            <Link
              href="/login"
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-md active:scale-98"
            >
              Sign In to Your Account
            </Link>
            <button
              onClick={() => setIsVerificationSent(false)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors"
            >
              Back to registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-gray-150/50">
        <div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
            >
              sign in to your account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-750 mb-1">
                  First Name
                </label>
                <input
                  {...register("firstName")}
                  type="text"
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-750 mb-1">
                  Last Name
                </label>
                <input
                  {...register("lastName")}
                  type="text"
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-750 mb-1">
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                placeholder="john.doe@example.com"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-750 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 pr-10 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                {...register("agreeToTerms")}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-305 rounded-md cursor-pointer"
              />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                I agree to the{" "}
                <Link href="/terms" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {errors.agreeToTerms.message}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isAnyLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md hover:shadow-lg transition-all duration-250 disabled:opacity-50 transform active:scale-98"
            >
              {registerLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
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
                  Or sign up with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleGoogleSignup}
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
                onClick={handleFacebookSignup}
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

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

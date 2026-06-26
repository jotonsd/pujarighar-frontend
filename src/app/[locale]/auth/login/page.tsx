"use client";

import { useFacebookLoginMutation, useGoogleLoginMutation, useLoginMutation } from "@/api/auth/authApi";
import { Checkbox, FloatingInput } from "@/components/ui/forms";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { facebookLogin, loadFacebookSdk } from "@/lib/facebookSdk";
import { useGoogleLogin } from "@react-oauth/google";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const isBn = locale === "bn";

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const [googleLoginMutation, { isLoading: isGoogleLoading }] =
    useGoogleLoginMutation();
  const [facebookLoginMutation, { isLoading: isFacebookLoading }] =
    useFacebookLoginMutation();

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (appId) loadFacebookSdk(appId);
  }, []);

  const handleAuthSuccess = (data: { user: { role: string; preferred_language?: string } }) => {
    toast.success(isBn ? "সফলভাবে লগইন হয়েছে" : "Logged in successfully");
    const role = data.user?.role;
    const dest = data.user?.preferred_language || "bn";
    if (role === "ADMIN" || role === "WAREHOUSE") {
      router.push(`/${dest}/admin/orders/new`);
    } else if (role === "DELIVERY") {
      router.push(`/${dest}/delivery/orders`);
    } else {
      router.push(`/${dest}`);
    }
  };

  const startFacebookLogin = async () => {
    try {
      const accessToken = await facebookLogin();
      const data = await facebookLoginMutation({ access_token: accessToken }).unwrap();
      setAuth(data.user, data.access, data.refresh, rememberMe);
      handleAuthSuccess(data);
    } catch (err: unknown) {
      const e = err as { data?: { errors?: { message_bn?: string; message_en?: string } } };
      toast.error(
        isBn
          ? (e.data?.errors?.message_bn ?? "Facebook লগইন ব্যর্থ হয়েছে")
          : (e.data?.errors?.message_en ?? "Facebook login failed"),
      );
    }
  };

  const startGoogleLogin = useGoogleLogin({
    flow: "implicit",
    onSuccess: async ({ access_token }) => {
      try {
        const data = await googleLoginMutation({ access_token }).unwrap();
        setAuth(data.user, data.access, data.refresh, rememberMe);
        handleAuthSuccess(data);
      } catch {
        toast.error(isBn ? "Google লগইন ব্যর্থ হয়েছে" : "Google login failed");
      }
    },
    onError: () =>
      toast.error(isBn ? "Google লগইন ব্যর্থ হয়েছে" : "Google login failed"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await login(form).unwrap();
      setAuth(data.user, data.access, data.refresh, rememberMe);
      handleAuthSuccess(data);
    } catch (err: unknown) {
      const e = err as {
        data?: {
          errors?: { details?: { message_bn?: string; message_en?: string } };
        };
      };
      toast.error(
        isBn
          ? (e.data?.errors?.details?.message_bn ?? "লগইন ব্যর্থ হয়েছে")
          : (e.data?.errors?.details?.message_en ?? "Login failed"),
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-gray-50 lg:bg-transparent">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-500 to-amber-700 items-center justify-center relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute w-72 h-72 rounded-full bg-white/10 -top-16 -left-16" />
        <div className="absolute w-48 h-48 rounded-full bg-white/10 bottom-10 -right-10" />
        <div className="absolute w-32 h-32 rounded-full bg-amber-400/40 top-1/2 left-1/3" />
        <div className="relative z-10 text-center px-10">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <Image
              src="/assets/logo/favicon.png"
              alt="PujariGhar"
              fill
              className="object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-white leading-snug">
            {isBn ? "পূজারিঘরে স্বাগতম" : "Welcome to PujariGhar"}
          </h2>
          <p className="mt-3 text-amber-100 text-sm leading-relaxed">
            {isBn
              ? "পূজার সকল প্রয়োজনীয় সামগ্রী এক জায়গায়।"
              : "All your puja essentials in one place."}
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12 bg-gray-50">
        {/* Card wrapper for crisp appearance on mobile */}
        <div className="w-full max-w-md bg-white lg:bg-transparent p-6 sm:p-8 lg:p-0 rounded-2xl shadow-sm lg:shadow-none border border-gray-100 lg:border-none relative overflow-hidden">
          {/* Subtle colorful top accent bar on mobile view to tie into the brand */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-600 lg:hidden" />

          {/* Logo — mobile only */}
          <div className="lg:hidden text-center mb-6 pt-2">
            <div className="relative w-40 h-14 mx-auto">
              <Image
                src="/assets/logo/pujarighar.png"
                alt="PujariGhar"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {isBn ? "লগইন করুন" : "Sign in"}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {isBn
                ? "আপনার অ্যাকাউন্টে প্রবেশ করুন"
                : "Enter your account details below"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-3">
              <FloatingInput
                label={isBn ? "ইমেইল বা ফোন নম্বর" : "Email or Phone Number"}
                required
                value={form.identifier}
                onChange={e => setForm({ ...form, identifier: e.target.value })}
                placeholder={
                  isBn ? "ইমেইল অথবা 01XXXXXXXXX" : "Email or 01XXXXXXXXX"
                }
              />
              <FloatingInput
                label={t("auth.password")}
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              <div className="flex items-center justify-between">
                <Checkbox
                  checked={rememberMe}
                  onChange={() => setRememberMe(p => !p)}
                  label={isBn ? "আমাকে মনে রাখুন" : "Remember me"}
                />
                <Link
                  href={`/${locale}/auth/forgot-password`}
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium hover:underline"
                >
                  {isBn ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot password?"}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 px-4 text-base font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading
                ? isBn
                  ? "প্রবেশ হচ্ছে..."
                  : "Signing in..."
                : isBn
                  ? "লগইন করুন"
                  : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">
              {isBn ? "অথবা" : "OR"}
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social Sign-In */}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => startGoogleLogin()}
              disabled={isGoogleLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors disabled:opacity-60 disabled:pointer-events-none"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z"
                  fill="#EA4335"
                />
              </svg>
              <span className="truncate">
                {isGoogleLoading
                  ? (isBn ? "..." : "Connecting...")
                  : "Google"}
              </span>
            </button>

            <button
              type="button"
              onClick={startFacebookLogin}
              disabled={isFacebookLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors disabled:opacity-60 disabled:pointer-events-none"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path
                  d="M18 9c0-4.97-4.03-9-9-9S0 4.03 0 9c0 4.49 3.29 8.21 7.59 8.89v-6.3H5.31V9h2.28V6.95c0-2.26 1.34-3.5 3.4-3.5.96 0 1.97.17 1.97.17v2.18h-1.11c-1.09 0-1.43.68-1.43 1.38V9h2.45l-.39 2.59h-2.06v6.3C14.71 17.21 18 13.49 18 9z"
                  fill="#1877F2"
                />
              </svg>
              <span className="truncate">
                {isFacebookLoading
                  ? (isBn ? "..." : "Connecting...")
                  : "Facebook"}
              </span>
            </button>
          </div>

          <div className="mt-5 text-center text-sm">
            <span className="text-gray-500">
              {isBn ? "অ্যাকাউন্ট নেই?" : "Don't have an account?"}{" "}
            </span>
            <Link
              href={`/${locale}/auth/register`}
              className="text-amber-600 hover:text-amber-700 font-semibold transition-colors hover:underline"
            >
              {isBn ? "রেজিস্ট্রেশন করুন" : "Register"}
            </Link>
          </div>

          <div className="mt-8 pt-5 border-t border-gray-100 lg:border-gray-200">
            <Link
              href={`/${locale}`}
              className="flex items-center justify-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span>←</span>
              <span>{isBn ? "হোমে ফিরুন" : "Back to Home"}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

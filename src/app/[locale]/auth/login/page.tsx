"use client";

import { useLoginMutation } from "@/api/auth/authApi";
import { FloatingInput } from "@/components/ui/forms";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const isBn = locale === "bn";

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await login(form).unwrap();
      setAuth(data.user, data.access, data.refresh);
      toast.success(isBn ? "সফলভাবে লগইন হয়েছে" : "Logged in successfully");
      const role = data.user?.role;
      if (role === "ADMIN" || role === "WAREHOUSE") {
        router.push(`/${locale}/admin/orders/new`);
      } else if (role === "DELIVERY") {
        router.push(`/${locale}/delivery/orders`);
      } else {
        router.push(`/${locale}`);
      }
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
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

          <div className="mt-6 text-center text-sm">
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

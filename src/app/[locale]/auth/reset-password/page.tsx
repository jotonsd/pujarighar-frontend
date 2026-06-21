"use client";

import { useResetPasswordMutation } from "@/api/auth/authApi";
import { FloatingInput } from "@/components/ui/forms";
import { toast } from "@/store/toastStore";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [done, setDone] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error(isBn ? "পাসওয়ার্ড দুটি মিলছে না" : "Passwords don't match");
      return;
    }
    if (!uid || !token) {
      toast.error(isBn ? "লিংকটি অবৈধ" : "Invalid reset link");
      return;
    }
    try {
      await resetPassword({ uid, token, new_password: form.password }).unwrap();
      setDone(true);
      setTimeout(() => router.push(`/${locale}/auth/login`), 2500);
    } catch (err: unknown) {
      const e = err as { data?: { errors?: { message_bn?: string; message_en?: string } } };
      toast.error(
        isBn
          ? (e.data?.errors?.message_bn ?? "পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে")
          : (e.data?.errors?.message_en ?? "Password reset failed"),
      );
    }
  };

  if (!uid || !token) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isBn ? "লিংকটি অবৈধ" : "Invalid Reset Link"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {isBn
              ? "এই লিংকটি অবৈধ বা মেয়াদ শেষ হয়ে গেছে। নতুন করে চেষ্টা করুন।"
              : "This link is invalid or has expired. Please request a new one."}
          </p>
          <Link href={`/${locale}/auth/forgot-password`} className="text-amber-600 hover:text-amber-700 font-semibold text-sm hover:underline">
            {isBn ? "নতুন লিংক পাঠান" : "Request New Link"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-gray-50 lg:bg-transparent">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-500 to-amber-700 items-center justify-center relative overflow-hidden">
        <div className="absolute w-72 h-72 rounded-full bg-white/10 -top-16 -left-16" />
        <div className="absolute w-48 h-48 rounded-full bg-white/10 bottom-10 -right-10" />
        <div className="absolute w-32 h-32 rounded-full bg-amber-400/40 top-1/2 left-1/3" />
        <div className="relative z-10 text-center px-10">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <Image src="/assets/logo/favicon.png" alt="PujariGhar" fill className="object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-white leading-snug">
            {isBn ? "নতুন পাসওয়ার্ড দিন" : "Set a New Password"}
          </h2>
          <p className="mt-3 text-amber-100 text-sm leading-relaxed">
            {isBn ? "একটি নিরাপদ পাসওয়ার্ড বেছে নিন।" : "Choose a strong password to keep your account secure."}
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12 bg-gray-50">
        <div className="w-full max-w-md bg-white lg:bg-transparent p-6 sm:p-8 lg:p-0 rounded-2xl shadow-sm lg:shadow-none border border-gray-100 lg:border-none relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-600 lg:hidden" />

          <div className="lg:hidden text-center mb-6 pt-2">
            <div className="relative w-40 h-14 mx-auto">
              <Image src="/assets/logo/pujarighar.png" alt="PujariGhar" fill className="object-contain" priority />
            </div>
          </div>

          {done ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {isBn ? "পাসওয়ার্ড পরিবর্তন হয়েছে" : "Password Reset Successful"}
              </h2>
              <p className="text-sm text-gray-500">
                {isBn ? "লগইন পেজে নিয়ে যাওয়া হচ্ছে..." : "Redirecting to login..."}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  {isBn ? "নতুন পাসওয়ার্ড" : "New Password"}
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  {isBn ? "আপনার নতুন পাসওয়ার্ড লিখুন" : "Enter your new password below"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <FloatingInput
                    label={isBn ? "নতুন পাসওয়ার্ড" : "New Password"}
                    type="password"
                    required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <FloatingInput
                    label={isBn ? "পাসওয়ার্ড নিশ্চিত করুন" : "Confirm Password"}
                    type="password"
                    required
                    value={form.confirm}
                    onChange={e => setForm({ ...form, confirm: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3.5 px-4 text-base font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isLoading
                    ? (isBn ? "পরিবর্তন হচ্ছে..." : "Resetting...")
                    : (isBn ? "পাসওয়ার্ড পরিবর্তন করুন" : "Reset Password")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useForgotPasswordMutation } from "@/api/auth/authApi";
import { FloatingInput } from "@/components/ui/forms";
import { toast } from "@/store/toastStore";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const isBn = locale === "bn";

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword({ email, locale }).unwrap();
      setSubmitted(true);
    } catch {
      toast.error(isBn ? "কিছু একটা ভুল হয়েছে, আবার চেষ্টা করুন" : "Something went wrong, please try again");
    }
  };

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
            {isBn ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot Your Password?"}
          </h2>
          <p className="mt-3 text-amber-100 text-sm leading-relaxed">
            {isBn ? "চিন্তা নেই, আমরা সাহায্য করব।" : "No worries, we'll help you reset it."}
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

          {submitted ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {isBn ? "ইমেইল পাঠানো হয়েছে" : "Check Your Email"}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {isBn
                  ? `যদি ${email} নিবন্ধিত থাকে, একটি পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।`
                  : `If ${email} is registered, a password reset link has been sent.`}
              </p>
              <Link href={`/${locale}/auth/login`} className="text-amber-600 hover:text-amber-700 font-semibold text-sm hover:underline">
                {isBn ? "লগইনে ফিরে যান" : "Back to Login"}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  {isBn ? "পাসওয়ার্ড রিসেট করুন" : "Reset Password"}
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  {isBn
                    ? "আপনার ইমেইল দিন, আমরা একটি রিসেট লিংক পাঠাব"
                    : "Enter your email and we'll send you a reset link"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <FloatingInput
                  label={isBn ? "ইমেইল" : "Email"}
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3.5 px-4 text-base font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isLoading
                    ? (isBn ? "পাঠানো হচ্ছে..." : "Sending...")
                    : (isBn ? "রিসেট লিংক পাঠান" : "Send Reset Link")}
                </button>
              </form>

              <div className="mt-8 pt-5 border-t border-gray-100 lg:border-gray-200">
                <Link
                  href={`/${locale}/auth/login`}
                  className="flex items-center justify-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span>←</span>
                  <span>{isBn ? "লগইনে ফিরে যান" : "Back to Login"}</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRegisterMutation } from "@/api/auth/authApi";
import { FloatingInput } from "@/components/ui/forms";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const isBn = locale === "bn";

  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    full_name_bn: "",
    full_name_en: "",
    referral_code: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [register, { isLoading }] = useRegisterMutation();

  const API_ERROR_LABELS: Record<string, { bn: string; en: string }> = {
    email:         { bn: "ইমেইল ইতিমধ্যে ব্যবহৃত হয়েছে", en: "Email is already registered" },
    phone:         { bn: "এই ফোন নম্বরে ইতিমধ্যে অ্যাকাউন্ট আছে", en: "Phone number is already registered" },
    password:      { bn: "পাসওয়ার্ড সঠিক নয়", en: "Password is invalid" },
    referral_code: { bn: "রেফারেল কোড সঠিক নয়", en: "Invalid referral code" },
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.full_name_bn.trim())
      e.full_name_bn = isBn ? "নাম (বাংলা) আবশ্যক" : "Bangla name is required";
    if (!form.email.trim())
      e.email = isBn ? "ইমেইল আবশ্যক" : "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = isBn ? "সঠিক ইমেইল লিখুন" : "Enter a valid email address";
    if (!form.phone.trim())
      e.phone = isBn ? "ফোন নম্বর আবশ্যক" : "Phone number is required";
    else if (!/^01[3-9]\d{8}$/.test(form.phone))
      e.phone = isBn ? "সঠিক বাংলাদেশি নম্বর লিখুন (01XXXXXXXXX)" : "Enter a valid BD number (01XXXXXXXXX)";
    if (!form.password)
      e.password = isBn ? "পাসওয়ার্ড আবশ্যক" : "Password is required";
    else if (form.password.length < 8)
      e.password = isBn ? "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে" : "Password must be at least 8 characters";
    if (form.referral_code && form.referral_code.length !== 8)
      e.referral_code = isBn ? "রেফারেল কোড ৮ অক্ষরের হতে হবে" : "Referral code must be 8 characters";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    try {
      const data = await register(form).unwrap();
      setAuth(data.user, data.access, data.refresh);
      toast.success(isBn ? "নিবন্ধন সফল হয়েছে" : "Registration successful");
      router.push(`/${locale}`);
    } catch (err: unknown) {
      const e = err as { data?: { errors?: Record<string, unknown> } };
      const errors = e.data?.errors ?? {};
      const mapped: Record<string, string> = {};

      for (const [field, messages] of Object.entries(errors)) {
        const arr = Array.isArray(messages) ? messages : [messages];
        const firstMsg = typeof arr[0] === "string" ? arr[0] : (arr[0] as { message_bn?: string; message_en?: string })?.[isBn ? "message_bn" : "message_en"] ?? "";
        mapped[field] = API_ERROR_LABELS[field]
          ? (isBn ? API_ERROR_LABELS[field].bn : API_ERROR_LABELS[field].en)
          : firstMsg;
      }

      if (Object.keys(mapped).length > 0) {
        setFieldErrors(mapped);
      } else {
        toast.error(isBn ? "নিবন্ধন ব্যর্থ হয়েছে" : "Registration failed");
      }
    }
  };

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [key]: e.target.value });
    if (fieldErrors[key]) setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-gray-50 lg:bg-transparent">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-amber-500 to-amber-700 items-center justify-center relative overflow-hidden">
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
            {isBn ? "যোগ দিন আমাদের সাথে" : "Join PujariGhar"}
          </h2>
          <p className="mt-3 text-amber-100 text-sm leading-relaxed">
            {isBn
              ? "নিবন্ধন করুন এবং সেরা পূজার সামগ্রী উপভোগ করুন।"
              : "Register and enjoy the best puja essentials."}
          </p>
          <div className="mt-8 flex flex-col gap-3 text-left max-w-xs mx-auto">
            {[
              isBn ? "✓ দ্রুত চেকআউট" : "✓ Fast checkout",
              isBn ? "✓ অর্ডার ট্র্যাকিং" : "✓ Order tracking",
              isBn ? "✓ বিশেষ অফার" : "✓ Exclusive offers",
            ].map(item => (
              <span
                key={item}
                className="text-amber-50 text-sm font-medium bg-white/10 py-2 px-4 rounded-lg backdrop-blur-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-3/5 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12 bg-gray-50">
        <div className="w-full max-w-md bg-white lg:bg-transparent p-6 sm:p-8 lg:p-0 rounded-2xl shadow-sm lg:shadow-none border border-gray-100 lg:border-none relative overflow-hidden">
          {/* Mobile Top Accent */}
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

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {isBn ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "Create your account"}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {isBn
                ? "নিচে আপনার তথ্য পূরণ করুন"
                : "Fill in your details below to get started"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FloatingInput
                label={t("auth.fullNameBn")}
               
                value={form.full_name_bn}
                onChange={f("full_name_bn")}
                error={fieldErrors.full_name_bn}
              />
              <FloatingInput
                label={t("auth.fullNameEn")}
                value={form.full_name_en}
                onChange={f("full_name_en")}
                error={fieldErrors.full_name_en}
              />
            </div>

            <FloatingInput
              label={t("auth.email")}
              type="email"
             
              value={form.email}
              onChange={f("email")}
              error={fieldErrors.email}
            />

            <FloatingInput
              label={t("auth.phone")}
             
              value={form.phone}
              onChange={f("phone")}
              placeholder="01XXXXXXXXX"
              error={fieldErrors.phone}
            />

            <FloatingInput
              label={t("auth.password")}
              type="password"
             
              value={form.password}
              onChange={f("password")}
              error={fieldErrors.password}
            />

            <FloatingInput
              label={isBn ? "রেফারেল কোড (ঐচ্ছিক)" : "Referral Code (optional)"}
              value={form.referral_code}
              onChange={f("referral_code")}
              placeholder="XXXXXXXX"
              error={fieldErrors.referral_code}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 px-4 text-base font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-70"
            >
              {isLoading
                ? isBn
                  ? "নিবন্ধন হচ্ছে..."
                  : "Creating account..."
                : isBn
                  ? "নিবন্ধন করুন"
                  : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">
              {isBn
                ? "ইতিমধ্যে অ্যাকাউন্ট আছে?"
                : "Already have an account?"}{" "}
            </span>
            <Link
              href={`/${locale}/auth/login`}
              className="text-amber-600 hover:text-amber-700 font-semibold transition-colors hover:underline"
            >
              {isBn ? "লগইন করুন" : "Sign in"}
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

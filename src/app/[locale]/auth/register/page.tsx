"use client";

import { useFacebookLoginMutation, useGoogleLoginMutation, useRegisterMutation } from "@/api/auth/authApi";
import { useGetSiteSettingsQuery } from "@/api/settings/settingsApi";
import { FloatingInput } from "@/components/ui/forms";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { facebookLogin, loadFacebookSdk } from "@/lib/facebookSdk";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Loaded only here (not app-wide) — same reasoning as the login page.
export default function RegisterPage() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""}>
      <RegisterForm />
    </GoogleOAuthProvider>
  );
}

function RegisterForm() {
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
  const [googleLoginMutation, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const [facebookLoginMutation, { isLoading: isFacebookLoading }] = useFacebookLoginMutation();
  const { data: siteSettings } = useGetSiteSettingsQuery();
  const showGoogleLogin = siteSettings?.google_login_enabled ?? true;
  const showFacebookLogin = siteSettings?.facebook_login_enabled ?? true;

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (appId) loadFacebookSdk(appId);
  }, []);

  // Both OAuth providers already find-or-create the account server-side
  // (_oauth_login_or_create in auth_views.py) — so the exact same call used
  // for login also doubles as "sign up with Google/Facebook" here.
  const handleOAuthSuccess = (data: { user: Parameters<typeof setAuth>[0]; access: string; refresh: string }) => {
    setAuth(data.user, data.access, data.refresh);
    toast.success(isBn ? "সফলভাবে প্রবেশ করেছেন" : "Signed in successfully");
    router.push(`/${locale}`);
  };

  const startFacebookLogin = async () => {
    try {
      const accessToken = await facebookLogin();
      const data = await facebookLoginMutation({ access_token: accessToken }).unwrap();
      handleOAuthSuccess(data);
    } catch (err: unknown) {
      const e = err as { data?: { errors?: { message_bn?: string; message_en?: string } } };
      toast.error(
        isBn
          ? (e.data?.errors?.message_bn ?? "Facebook দিয়ে প্রবেশ ব্যর্থ হয়েছে")
          : (e.data?.errors?.message_en ?? "Facebook sign-up failed"),
      );
    }
  };

  const startGoogleLogin = useGoogleLogin({
    flow: "implicit",
    onSuccess: async ({ access_token }) => {
      try {
        const data = await googleLoginMutation({ access_token }).unwrap();
        handleOAuthSuccess(data);
      } catch {
        toast.error(isBn ? "Google দিয়ে প্রবেশ ব্যর্থ হয়েছে" : "Google sign-up failed");
      }
    },
    onError: () =>
      toast.error(isBn ? "Google দিয়ে প্রবেশ ব্যর্থ হয়েছে" : "Google sign-up failed"),
  });

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

    const hasEmail = form.email.trim().length > 0;
    const hasPhone = form.phone.trim().length > 0;
    if (!hasEmail && !hasPhone) {
      const msg = isBn ? "ইমেইল অথবা ফোন নম্বর আবশ্যক" : "Email or phone number is required";
      e.email = msg;
      e.phone = msg;
    } else {
      if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        e.email = isBn ? "সঠিক ইমেইল লিখুন" : "Enter a valid email address";
      if (hasPhone && !/^01[3-9]\d{8}$/.test(form.phone))
        e.phone = isBn ? "সঠিক বাংলাদেশি নম্বর লিখুন (01XXXXXXXXX)" : "Enter a valid BD number (01XXXXXXXXX)";
    }

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
    <div className="min-h-[calc(100vh-4rem)] flex bg-background lg:bg-transparent">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-amber-500 to-amber-700 items-center justify-center relative overflow-hidden">
        <div className="absolute w-72 h-72 rounded-full bg-surface/10 -top-16 -left-16" />
        <div className="absolute w-48 h-48 rounded-full bg-surface/10 bottom-10 -right-10" />
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
                className="text-amber-50 text-sm font-medium bg-surface/10 py-2 px-4 rounded-lg backdrop-blur-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-3/5 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12 bg-background">
        <div className="w-full max-w-md bg-surface lg:bg-transparent p-6 sm:p-8 lg:p-0 rounded-2xl shadow-sm lg:shadow-none border border-border lg:border-none relative overflow-hidden">
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
            <h2 className="text-2xl sm:text-3xl font-bold text-body tracking-tight">
              {isBn ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "Create your account"}
            </h2>
            <p className="text-sm text-muted mt-2">
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

            <p className="text-xs text-muted -mb-1">
              {isBn ? "ইমেইল অথবা ফোন নম্বর — যেকোনো একটি দিন" : "Email or phone number — provide at least one"}
            </p>

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

          {/* Divider + Social Sign-Up — hidden entirely if both are disabled */}
          {(showGoogleLogin || showFacebookLogin) && (
            <>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted font-medium">
                  {isBn ? "অথবা" : "OR"}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="mt-4 flex gap-3">
                {showGoogleLogin && (
                  <button
                    type="button"
                    onClick={() => startGoogleLogin()}
                    disabled={isGoogleLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-border rounded-xl bg-surface hover:bg-surface-alt text-sm font-medium text-muted transition-colors disabled:opacity-60 disabled:pointer-events-none"
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
                        ? (isBn ? "সংযুক্ত হচ্ছে..." : "Connecting...")
                        : "Google"}
                    </span>
                  </button>
                )}

                {showFacebookLogin && (
                  <button
                    type="button"
                    onClick={startFacebookLogin}
                    disabled={isFacebookLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-border rounded-xl bg-surface hover:bg-surface-alt text-sm font-medium text-muted transition-colors disabled:opacity-60 disabled:pointer-events-none"
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
                )}
              </div>
            </>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-muted">
              {isBn
                ? "ইতিমধ্যে অ্যাকাউন্ট আছে?"
                : "Already have an account?"}{" "}
            </span>
            <Link
              href={`/${locale}/auth/login`}
              className="text-amber-700 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-400 font-semibold transition-colors hover:underline"
            >
              {isBn ? "লগইন করুন" : "Sign in"}
            </Link>
          </div>

          <div className="mt-8 pt-5 border-t border-border lg:border-border">
            <Link
              href={`/${locale}`}
              className="flex items-center justify-center gap-2 text-sm font-medium text-muted hover:text-muted transition-colors"
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

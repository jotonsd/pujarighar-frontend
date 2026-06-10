"use client";

import { useChangePasswordMutation } from "@/api/auth/authApi";
import { FloatingInput } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "@/store/toastStore";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChangePasswordPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      toast.error(
        locale === "bn"
          ? "নতুন পাসওয়ার্ড মিলছে না"
          : "New passwords do not match",
      );
      return;
    }
    if (form.new_password.length < 6) {
      toast.error(
        locale === "bn"
          ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"
          : "Password must be at least 6 characters",
      );
      return;
    }
    try {
      await changePassword({
        old_password: form.old_password,
        new_password: form.new_password,
      }).unwrap();
      toast.success(
        locale === "bn"
          ? "পাসওয়ার্ড পরিবর্তন হয়েছে"
          : "Password changed successfully",
      );
      router.back();
    } catch (err: unknown) {
      const msg = (
        err as {
          data?: { error?: { message_bn?: string; message_en?: string } };
        }
      ).data?.error;
      toast.error(
        locale === "bn"
          ? (msg?.message_bn ?? "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে")
          : (msg?.message_en ?? "Failed to change password"),
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <PageHeader
        title={t("auth.changePassword")}
        description={locale === 'bn' ? 'অ্যাকাউন্টের নিরাপত্তার জন্য নিয়মিত পাসওয়ার্ড পরিবর্তন করুন' : 'Change your password regularly to keep your account secure'}
        showBack
      />
      <div className="card max-w-md space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FloatingInput
            label={locale === "bn" ? "বর্তমান পাসওয়ার্ড" : "Current Password"}
            type="password"
            required
            value={form.old_password}
            onChange={f("old_password")}
          />
          <FloatingInput
            label={locale === "bn" ? "নতুন পাসওয়ার্ড" : "New Password"}
            type="password"
            required
            value={form.new_password}
            onChange={f("new_password")}
          />
          <FloatingInput
            label={
              locale === "bn"
                ? "নতুন পাসওয়ার্ড নিশ্চিত করুন"
                : "Confirm New Password"
            }
            type="password"
            required
            value={form.confirm_password}
            onChange={f("confirm_password")}
          />
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading
                ? locale === "bn"
                  ? "পরিবর্তন হচ্ছে..."
                  : "Changing..."
                : locale === "bn"
                  ? "পাসওয়ার্ড পরিবর্তন করুন"
                  : "Change Password"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary flex-1"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

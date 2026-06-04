"use client";

import { useUpdateMeMutation } from "@/api/auth/authApi";
import { FloatingInput, FloatingTextarea } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import Cookies from "js-cookie";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

export default function ProfilePage() {
  const t = useTranslations();
  const locale = useLocale();
  const user = useAuthStore(s => s.user);

  const [form, setForm] = useState({
    full_name_bn: user?.profile?.full_name_bn ?? "",
    full_name_en: user?.profile?.full_name_en ?? "",
    address_bn: user?.profile?.address_bn ?? "",
    address_en: user?.profile?.address_en ?? "",
    district: user?.profile?.district ?? "",
    thana: user?.profile?.thana ?? "",
    post_code: user?.profile?.post_code ?? "",
  });

  const [updateMe, { isLoading }] = useUpdateMeMutation();

  const handleUpdate = async () => {
    try {
      const updated = await updateMe(form).unwrap();
      Cookies.set("user", JSON.stringify(updated), { expires: 7 });
      toast.success(
        locale === "bn" ? "প্রোফাইল আপডেট হয়েছে" : "Profile updated",
      );
    } catch {
      toast.error(locale === "bn" ? "আপডেট ব্যর্থ হয়েছে" : "Update failed");
    }
  };

  const f =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value });

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <PageHeader title={t("profile.title")} />
      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FloatingInput
            label={t("profile.fullNameBn")}
            value={form.full_name_bn}
            onChange={f("full_name_bn")}
          />
          <FloatingInput
            label={t("profile.fullNameEn")}
            value={form.full_name_en}
            onChange={f("full_name_en")}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FloatingTextarea
            label={`${t("profile.address")} (বাংলা)`}
            value={form.address_bn}
            onChange={f("address_bn")}
            rows={2}
          />
          <FloatingTextarea
            label={`${t("profile.address")} (English)`}
            value={form.address_en}
            onChange={f("address_en")}
            rows={2}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FloatingInput
            label={t("profile.district")}
            value={form.district}
            onChange={f("district")}
          />
          <FloatingInput
            label={t("profile.thana")}
            value={form.thana}
            onChange={f("thana")}
          />
          <FloatingInput
            label={t("profile.postCode")}
            value={form.post_code}
            onChange={f("post_code")}
          />
        </div>
        <button
          onClick={handleUpdate}
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? t("common.loading") : t("profile.update")}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useGetMeQuery, useUpdateMeMutation } from "@/api/auth/authApi";
import { FloatingInput, FloatingTextarea } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "@/store/toastStore";
import Cookies from "js-cookie";
import { Camera } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

export default function ProfilePage() {
  const t = useTranslations();
  const locale = useLocale();

  const { data: me } = useGetMeQuery();

  const [form, setForm] = useState({
    full_name_bn: "",
    full_name_en: "",
    address_bn: "",
    address_en: "",
    district: "",
    thana: "",
    post_code: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (me?.profile) {
      setForm({
        full_name_bn: me.profile.full_name_bn ?? "",
        full_name_en: me.profile.full_name_en ?? "",
        address_bn: me.profile.address_bn ?? "",
        address_en: me.profile.address_en ?? "",
        district: me.profile.district ?? "",
        thana: me.profile.thana ?? "",
        post_code: me.profile.post_code ?? "",
      });
      setAvatarPreview(me.profile.avatar ?? null);
    }
  }, [me]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updateMe, { isLoading }] = useUpdateMeMutation();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUpdate = async () => {
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (avatarFile) fd.append("avatar", avatarFile);
      const updated = await updateMe(fd).unwrap();
      Cookies.set("user", JSON.stringify(updated), { expires: 7 });
      setAvatarFile(null);
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
    <div className="max-w-7xl mx-auto px-4 py-3">
      <PageHeader
        title={t("profile.title")}
        description={
          locale === "bn"
            ? "আপনার ব্যক্তিগত তথ্য ও ঠিকানা আপডেট করুন"
            : "Update your personal information and address"
        }
      />
      <div className="card space-y-4">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full bg-amber-100 border-2 border-amber-200 overflow-hidden flex items-center justify-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl text-amber-400">
                  {(me?.profile?.full_name_bn || me?.email || "U")[0].toUpperCase()}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow"
            >
              <Camera className="w-3 h-3" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="font-medium text-gray-700 text-sm">
              {locale === "bn" ? "প্রোফাইল ছবি" : "Profile Photo"}
            </p>
            <p className="text-xs text-gray-400">
              {locale === "bn"
                ? "ছবিতে ক্লিক করে পরিবর্তন করুন"
                : "Click photo to change"}
            </p>
            {avatarFile && (
              <p className="text-xs text-amber-600 mt-0.5">{avatarFile.name}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
        <div className="grid grid-cols-2 gap-3">
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
        <div className="grid grid-cols-3 gap-3">
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

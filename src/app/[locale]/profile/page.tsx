"use client";

import { useChangePasswordMutation, useGetMeQuery, useUpdateMeMutation } from "@/api/auth/authApi";
import ShippingAddressesTab from "@/components/profile/ShippingAddressesTab";
import { FloatingInput, FloatingTextarea } from "@/components/ui/forms";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "@/store/toastStore";
import Cookies from "js-cookie";
import { Bell, Camera, Globe, Lock, MapPin, User as UserIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Tab = "profile" | "password" | "language" | "notifications" | "addresses";

export default function ProfilePage() {
  const t = useTranslations();
  const locale = useLocale();
  const isBn = locale === "bn";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: me } = useGetMeQuery();
  const isCustomer = me?.role === "CUSTOMER";
  const tabParam = searchParams.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(tabParam ?? "profile");

  const [form, setForm] = useState({
    full_name_bn: "",
    full_name_en: "",
    phone: "",
    address_bn: "",
    address_en: "",
    district: "",
    thana: "",
    post_code: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [pwForm, setPwForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [changePassword, { isLoading: pwLoading }] = useChangePasswordMutation();

  useEffect(() => {
    if (me?.profile) {
      setForm({
        full_name_bn: me.profile.full_name_bn ?? "",
        full_name_en: me.profile.full_name_en ?? "",
        phone: me.phone ?? "",
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
    setFieldErrors(prev => { const n = { ...prev }; delete n.avatar; return n; });

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFieldErrors(prev => ({
        ...prev,
        avatar: isBn ? "শুধুমাত্র JPG, PNG, WEBP বা GIF ছবি আপলোড করা যাবে" : "Only JPG, PNG, WEBP, or GIF images are allowed",
      }));
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors(prev => ({
        ...prev,
        avatar: isBn ? "ছবির আকার ৫ এমবি-এর বেশি হতে পারবে না" : "Image size must not exceed 5MB",
      }));
      e.target.value = "";
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUpdate = async () => {
    // Mirrors the backend's exact rule (api/views/user_views.py::update_me) so an
    // obviously malformed number is caught instantly instead of round-tripping.
    if (form.phone && !/^01\d{9}$/.test(form.phone.trim())) {
      setFieldErrors({
        phone: locale === "bn"
          ? "সঠিক ১১ ডিজিটের ফোন নম্বর দিন (যেমনঃ 01XXXXXXXXX)"
          : "Enter a valid 11-digit phone number (e.g. 01XXXXXXXXX)",
      });
      return;
    }

    setFieldErrors({});
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
    } catch (err: unknown) {
      type FieldError = string | string[] | { message_bn?: string; message_en?: string };
      const errors = (err as { data?: { errors?: Record<string, FieldError> } }).data?.errors;
      const parsed: Record<string, string> = {};
      if (errors && typeof errors === "object") {
        for (const [key, val] of Object.entries(errors)) {
          if (Array.isArray(val)) parsed[key] = String(val[0]);
          else if (typeof val === "string") parsed[key] = val;
          else if (val && typeof val === "object") {
            parsed[key] = (locale === "bn" ? val.message_bn : val.message_en) ?? "";
          }
        }
      }
      setFieldErrors(parsed);
      const firstMsg = Object.values(parsed)[0];
      toast.error(firstMsg || (locale === "bn" ? "আপডেট ব্যর্থ হয়েছে" : "Update failed"));
    }
  };

  const handleLanguageChange = async (lang: "bn" | "en") => {
    try {
      const updated = await updateMe({ preferred_language: lang }).unwrap();
      Cookies.set("user", JSON.stringify(updated), { expires: 7 });
      toast.success(lang === "bn" ? "ভাষা পরিবর্তন হয়েছে" : "Language updated");
      if (lang !== locale) {
        const newPath = pathname.replace(`/${locale}`, `/${lang}`);
        router.push(`${newPath}?tab=language`);
      }
    } catch {
      toast.error(locale === "bn" ? "আপডেট ব্যর্থ হয়েছে" : "Update failed");
    }
  };

  const handleNotifyToggle = async (
    key: "notify_marketing" | "notify_new_product" | "notify_new_package" | "notify_offers",
    value: boolean,
  ) => {
    try {
      const updated = await updateMe({ [key]: value }).unwrap();
      Cookies.set("user", JSON.stringify(updated), { expires: 7 });
    } catch {
      toast.error(locale === "bn" ? "আপডেট ব্যর্থ হয়েছে" : "Update failed");
    }
  };

  const f =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm({ ...form, [key]: e.target.value });
      if (fieldErrors[key]) setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    };

  const pf = (key: keyof typeof pwForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPwForm(p => ({ ...p, [key]: e.target.value }));
    if (fieldErrors[key]) setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: Record<string, string> = {};
    if (!pwForm.old_password) {
      validationErrors.old_password = locale === "bn" ? "বর্তমান পাসওয়ার্ড আবশ্যক" : "Current password is required";
    }
    if (!pwForm.new_password) {
      validationErrors.new_password = locale === "bn" ? "নতুন পাসওয়ার্ড আবশ্যক" : "New password is required";
    } else if (pwForm.new_password.length < 6) {
      validationErrors.new_password = locale === "bn" ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" : "Password must be at least 6 characters";
    }
    if (!pwForm.confirm_password) {
      validationErrors.confirm_password = locale === "bn" ? "পাসওয়ার্ড নিশ্চিত করুন" : "Please confirm your password";
    } else if (pwForm.new_password !== pwForm.confirm_password) {
      validationErrors.confirm_password = locale === "bn" ? "নতুন পাসওয়ার্ড মিলছে না" : "New passwords do not match";
    }
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    try {
      await changePassword({
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      }).unwrap();
      toast.success(locale === "bn" ? "পাসওয়ার্ড পরিবর্তন হয়েছে" : "Password changed successfully");
      setPwForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err: unknown) {
      type FieldError = string | string[] | { message_bn?: string; message_en?: string };
      const apiErrors = (err as { data?: { errors?: Record<string, FieldError> } }).data?.errors;
      const parsed: Record<string, string> = {};
      if (apiErrors && typeof apiErrors === "object") {
        for (const [key, val] of Object.entries(apiErrors)) {
          if (Array.isArray(val)) parsed[key] = String(val[0]);
          else if (typeof val === "string") parsed[key] = val;
          else if (val && typeof val === "object") {
            parsed[key] = (locale === "bn" ? val.message_bn : val.message_en) ?? "";
          }
        }
      }
      setFieldErrors(parsed);
      const firstMsg = Object.values(parsed)[0];
      toast.error(firstMsg || (locale === "bn" ? "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে" : "Failed to change password"));
    }
  };

  const TABS: { key: Tab; icon: React.ReactNode; bn: string; en: string }[] = [
    { key: "profile", icon: <UserIcon className="w-4 h-4" />, bn: "প্রোফাইল", en: "Profile" },
    { key: "password", icon: <Lock className="w-4 h-4" />, bn: "পাসওয়ার্ড পরিবর্তন", en: "Change Password" },
    { key: "language", icon: <Globe className="w-4 h-4" />, bn: "ভাষা পছন্দ", en: "Preferred Language" },
    ...(isCustomer
      ? [
          { key: "addresses" as Tab, icon: <MapPin className="w-4 h-4" />, bn: "শিপিং ঠিকানা", en: "Shipping Addresses" },
          { key: "notifications" as Tab, icon: <Bell className="w-4 h-4" />, bn: "নোটিফিকেশন সেটিং", en: "Notification Settings" },
        ]
      : []),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <PageHeader
        title={isBn ? "সেটিং" : "Settings"}
        description={
          locale === "bn"
            ? "আপনার অ্যাকাউন্ট ও পছন্দসমূহ পরিচালনা করুন"
            : "Manage your account and preferences"
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
        {/* Left panel — tabs */}
        <div className="card p-2 h-fit md:sticky md:top-20">
          <nav className="flex md:flex-col gap-1">
            {TABS.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                  tab === tb.key
                    ? "bg-amber-50 text-amber-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tb.icon}
                {isBn ? tb.bn : tb.en}
              </button>
            ))}
          </nav>
        </div>

        {/* Right panel — content */}
        <div>
          {tab === "profile" && (
            <div className="card space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-full bg-amber-100 border-2 border-amber-200 overflow-hidden flex items-center justify-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {(avatarPreview || me?.profile?.avatar) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarPreview || me?.profile?.avatar || ""}
                        alt="avatar"
                        referrerPolicy="no-referrer"
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
                  {fieldErrors.avatar && (
                    <p className="text-xs text-red-500 mt-0.5">{fieldErrors.avatar}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FloatingInput
                  label={t("profile.fullNameBn")}
                  value={form.full_name_bn}
                  onChange={f("full_name_bn")}
                  error={fieldErrors.full_name_bn}
                />
                <FloatingInput
                  label={t("profile.fullNameEn")}
                  value={form.full_name_en}
                  onChange={f("full_name_en")}
                  error={fieldErrors.full_name_en}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FloatingInput
                  label={isBn ? "ফোন নম্বর" : "Phone Number"}
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={form.phone}
                  onChange={f("phone")}
                  error={fieldErrors.phone}
                />
                <FloatingInput
                  label={isBn ? "ইমেইল" : "Email"}
                  value={me?.email ?? ""}
                  disabled
                  className="bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FloatingTextarea
                  label={`${t("profile.address")} (বাংলা)`}
                  value={form.address_bn}
                  onChange={f("address_bn")}
                  rows={2}
                  error={fieldErrors.address_bn}
                />
                <FloatingTextarea
                  label={`${t("profile.address")} (English)`}
                  value={form.address_en}
                  onChange={f("address_en")}
                  rows={2}
                  error={fieldErrors.address_en}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FloatingInput
                  label={t("profile.district")}
                  value={form.district}
                  onChange={f("district")}
                  error={fieldErrors.district}
                />
                <FloatingInput
                  label={t("profile.thana")}
                  value={form.thana}
                  onChange={f("thana")}
                  error={fieldErrors.thana}
                />
                <FloatingInput
                  label={t("profile.postCode")}
                  value={form.post_code}
                  onChange={f("post_code")}
                  error={fieldErrors.post_code}
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
          )}

          {tab === "password" && (
            <div className="card max-w-md space-y-4">
              <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {t("auth.changePassword")}
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <FloatingInput
                  label={locale === "bn" ? "বর্তমান পাসওয়ার্ড" : "Current Password"}
                  type="password"
                  value={pwForm.old_password}
                  onChange={pf("old_password")}
                  error={fieldErrors.old_password}
                />
                <FloatingInput
                  label={locale === "bn" ? "নতুন পাসওয়ার্ড" : "New Password"}
                  type="password"
                  value={pwForm.new_password}
                  onChange={pf("new_password")}
                  error={fieldErrors.new_password}
                />
                <FloatingInput
                  label={locale === "bn" ? "নতুন পাসওয়ার্ড নিশ্চিত করুন" : "Confirm New Password"}
                  type="password"
                  value={pwForm.confirm_password}
                  onChange={pf("confirm_password")}
                  error={fieldErrors.confirm_password}
                />
                <button type="submit" disabled={pwLoading} className="btn-primary">
                  {pwLoading
                    ? (locale === "bn" ? "পরিবর্তন হচ্ছে..." : "Changing...")
                    : (locale === "bn" ? "পাসওয়ার্ড পরিবর্তন করুন" : "Change Password")}
                </button>
              </form>
            </div>
          )}

          {tab === "language" && (
            <div className="card max-w-md space-y-4">
              <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {isBn ? "ভাষা পছন্দ" : "Preferred Language"}
              </h2>
              <p className="text-xs text-gray-400">
                {isBn
                  ? "এই ভাষায় আপনি ইমেইল ও নোটিফিকেশন পাবেন"
                  : "You'll receive emails and notifications in this language"}
              </p>
              <div className="flex gap-2">
                {[
                  { code: "bn" as const, label: "বাংলা" },
                  { code: "en" as const, label: "English" },
                ].map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => handleLanguageChange(opt.code)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      (me?.preferred_language ?? "bn") === opt.code
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "addresses" && isCustomer && (
            <ShippingAddressesTab locale={locale} />
          )}

          {tab === "notifications" && isCustomer && (
            <div className="card max-w-md space-y-4">
              <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                {locale === "bn" ? "ইমেইল নোটিফিকেশন" : "Email Notifications"}
              </h2>

              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {locale === "bn" ? "প্রচারণামূলক ইমেইল" : "Marketing Emails"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {locale === "bn"
                      ? "বন্ধ করলে আপনি নিচের কোনো ক্যাটাগরির ইমেইলই পাবেন না"
                      : "Turning this off stops all categories below"}
                  </p>
                </div>
                <ToggleSwitch
                  checked={me?.profile?.notify_marketing ?? true}
                  onChange={() => handleNotifyToggle("notify_marketing", !(me?.profile?.notify_marketing ?? true))}
                />
              </div>

              {[
                { key: "notify_new_product" as const, bn: "নতুন পণ্য যোগ হলে", en: "New product added" },
                { key: "notify_new_package" as const, bn: "নতুন প্যাকেজ যোগ হলে", en: "New package added" },
                { key: "notify_offers" as const, bn: "অফার ও ছাড়", en: "Offers & discounts" },
              ].map((row) => (
                <div key={row.key} className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{locale === "bn" ? row.bn : row.en}</p>
                  <ToggleSwitch
                    checked={me?.profile?.[row.key] ?? true}
                    disabled={!(me?.profile?.notify_marketing ?? true)}
                    onChange={() => handleNotifyToggle(row.key, !(me?.profile?.[row.key] ?? true))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

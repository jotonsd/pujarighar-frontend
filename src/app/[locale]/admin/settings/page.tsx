"use client";

import {
  InvoicePageSize,
  SiteSettings,
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
} from "@/api/settings/settingsApi";
import ImageUpload from "@/components/ui/ImageUpload";
import PageHeader from "@/components/ui/PageHeader";
import { FloatingInput, FloatingTextarea } from "@/components/ui/forms";
import { toast } from "@/store/toastStore";
import { Building2, FileText, Mail } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

// ── Menu config ────────────────────────────────────────────────────────────────
type SectionId = "general" | "invoice" | "mail";

const MENU: { id: SectionId; icon: React.ReactNode; label_bn: string; label_en: string }[] = [
  { id: "general", icon: <Building2 className="w-4 h-4" />, label_bn: "সাধারণ তথ্য",  label_en: "General Info" },
  { id: "invoice", icon: <FileText  className="w-4 h-4" />, label_bn: "চালান প্রিন্ট", label_en: "Invoice Print" },
  { id: "mail",    icon: <Mail      className="w-4 h-4" />, label_bn: "মেইল কনফিগ",    label_en: "Mail Config" },
];

// ── Page-size options ──────────────────────────────────────────────────────────
const PAGE_SIZES: { value: InvoicePageSize; label: string; desc_bn: string; desc_en: string }[] = [
  { value: "A4",      label: "A4",         desc_bn: "২১০ × ২৯৭ মিমি — আন্তর্জাতিক স্ট্যান্ডার্ড",    desc_en: "210 × 297mm — International standard" },
  { value: "A5",      label: "A5",         desc_bn: "১৪৮ × ২১০ মিমি — A4 এর অর্ধেক",                   desc_en: "148 × 210mm — Half of A4" },
  { value: "LETTER",  label: "US Letter",  desc_bn: "২১৬ × ২৭৯ মিমি — উত্তর আমেরিকা স্ট্যান্ডার্ড",  desc_en: "216 × 279mm — North America standard" },
  { value: "THERMAL", label: "POS Thermal",desc_bn: "৮০মিমি রোল — থার্মাল প্রিন্টার রসিদ",            desc_en: "80mm roll — Thermal printer receipt" },
];

// ── General panel ──────────────────────────────────────────────────────────────
function GeneralPanel({ settings, isBn }: { settings: SiteSettings; isBn: boolean }) {
  const [form, setForm] = useState({
    company_name_bn: settings.company_name_bn,
    company_name_en: settings.company_name_en,
    contact_phone:   settings.contact_phone,
    contact_email:   settings.contact_email,
    address_bn:      settings.address_bn,
    address_en:      settings.address_en,
  });
  const [logoFiles,    setLogoFiles]    = useState<File[]>([]);
  const [faviconFiles, setFaviconFiles] = useState<File[]>([]);
  const [logoPrev,     setLogoPrev]     = useState<string | null>(settings.logo);
  const [faviconPrev,  setFaviconPrev]  = useState<string | null>(settings.favicon);

  useEffect(() => {
    setForm({
      company_name_bn: settings.company_name_bn,
      company_name_en: settings.company_name_en,
      contact_phone:   settings.contact_phone,
      contact_email:   settings.contact_email,
      address_bn:      settings.address_bn,
      address_en:      settings.address_en,
    });
    setLogoPrev(settings.logo);
    setFaviconPrev(settings.favicon);
  }, [settings]);

  const [update, { isLoading }] = useUpdateSiteSettingsMutation();

  const f = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (logoFiles[0])    fd.append("logo",    logoFiles[0]);
      if (faviconFiles[0]) fd.append("favicon", faviconFiles[0]);
      await update(fd).unwrap();
      setLogoFiles([]);
      setFaviconFiles([]);
      toast.success(isBn ? "সংরক্ষিত হয়েছে" : "Saved");
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed to save");
    }
  };

  return (
    <div className="space-y-4">
      {/* Logo & Favicon */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">{isBn ? "লোগো" : "Logo"}</p>
          <ImageUpload
            existingImages={logoPrev ? [{ id: 'logo', image: logoPrev }] : []}
            onDeleteExisting={() => setLogoPrev(null)}
            onFilesChange={setLogoFiles}
            maxImages={1}
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">{isBn ? "ফেভিকন" : "Favicon"}</p>
          <ImageUpload
            existingImages={faviconPrev ? [{ id: 'favicon', image: faviconPrev }] : []}
            onDeleteExisting={() => setFaviconPrev(null)}
            onFilesChange={setFaviconFiles}
            maxImages={1}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FloatingInput label={isBn ? "কোম্পানির নাম (বাংলা)" : "Company Name (Bangla)"} value={form.company_name_bn} onChange={f("company_name_bn")} />
        <FloatingInput label={isBn ? "কোম্পানির নাম (ইংরেজি)" : "Company Name (English)"} value={form.company_name_en} onChange={f("company_name_en")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FloatingInput label={isBn ? "ফোন নম্বর" : "Phone Number"} value={form.contact_phone} onChange={f("contact_phone")} />
        <FloatingInput label={isBn ? "ইমেইল" : "Email"} value={form.contact_email} onChange={f("contact_email")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FloatingTextarea label={isBn ? "ঠিকানা (বাংলা)" : "Address (Bangla)"} value={form.address_bn} onChange={f("address_bn")} rows={3} />
        <FloatingTextarea label={isBn ? "ঠিকানা (ইংরেজি)" : "Address (English)"} value={form.address_en} onChange={f("address_en")} rows={3} />
      </div>
      <button onClick={handleSave} disabled={isLoading} className="btn-primary">
        {isLoading ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save Changes")}
      </button>
    </div>
  );
}

// ── Invoice panel ──────────────────────────────────────────────────────────────
function InvoicePanel({ settings, isBn }: { settings: SiteSettings; isBn: boolean }) {
  const [update, { isLoading }] = useUpdateSiteSettingsMutation();

  const handleSelect = async (size: InvoicePageSize) => {
    if (size === settings.invoice_page_size || isLoading) return;
    try {
      await update({ invoice_page_size: size }).unwrap();
      toast.success(isBn ? "সংরক্ষিত হয়েছে" : "Saved");
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed to save");
    }
  };

  return (
    <div className="space-y-2">
      {PAGE_SIZES.map(opt => {
        const selected = settings.invoice_page_size === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            disabled={isLoading}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2 text-left transition-all ${
              selected ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-amber-300 hover:bg-gray-50"
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? "border-amber-500" : "border-gray-300"}`}>
              {selected && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-sm ${selected ? "text-amber-700" : "text-gray-800"}`}>{opt.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{isBn ? opt.desc_bn : opt.desc_en}</p>
            </div>
            {selected && (
              <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                {isBn ? "নির্বাচিত" : "Active"}
              </span>
            )}
          </button>
        );
      })}
      <p className="text-xs text-gray-400 pt-1">
        {isBn
          ? "পরিবর্তন তাৎক্ষণিকভাবে কার্যকর — পরবর্তী চালান থেকে প্রযোজ্য।"
          : "Changes take effect immediately — applies from the next invoice."}
      </p>
    </div>
  );
}

// ── Mail panel ─────────────────────────────────────────────────────────────────
function MailPanel({ settings, isBn }: { settings: SiteSettings; isBn: boolean }) {
  const [form, setForm] = useState({
    email_host:          settings.email_host,
    email_port:          String(settings.email_port ?? 587),
    email_host_user:     settings.email_host_user,
    email_host_password: settings.email_host_password,
    email_use_tls:       settings.email_use_tls,
    email_default_from:  settings.email_default_from,
  });

  useEffect(() => {
    setForm({
      email_host:          settings.email_host,
      email_port:          String(settings.email_port ?? 587),
      email_host_user:     settings.email_host_user,
      email_host_password: settings.email_host_password,
      email_use_tls:       settings.email_use_tls,
      email_default_from:  settings.email_default_from,
    });
  }, [settings]);

  const [update, { isLoading }] = useUpdateSiteSettingsMutation();

  const f = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    try {
      await update({
        email_host:          form.email_host,
        email_port:          Number(form.email_port) || 587,
        email_host_user:     form.email_host_user,
        email_host_password: form.email_host_password,
        email_use_tls:       form.email_use_tls,
        email_default_from:  form.email_default_from,
      } as Partial<SiteSettings>).unwrap();
      toast.success(isBn ? "সংরক্ষিত হয়েছে" : "Saved");
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed to save");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FloatingInput label={isBn ? "SMTP হোস্ট" : "SMTP Host"} value={form.email_host} onChange={f("email_host")} placeholder="smtp.gmail.com" />
        <FloatingInput label={isBn ? "পোর্ট" : "Port"} type="number" value={form.email_port} onChange={f("email_port")} placeholder="587" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FloatingInput label={isBn ? "ইউজারনেম / ইমেইল" : "Username / Email"} value={form.email_host_user} onChange={f("email_host_user")} />
        <FloatingInput label={isBn ? "পাসওয়ার্ড / অ্যাপ কী" : "Password / App Key"} type="password" value={form.email_host_password} onChange={f("email_host_password")} />
      </div>
      <FloatingInput label={isBn ? "ডিফল্ট প্রেরক ইমেইল" : "Default From Email"} value={form.email_default_from} onChange={f("email_default_from")} placeholder="noreply@pujarighar.com" />
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          onClick={() => setForm(p => ({ ...p, email_use_tls: !p.email_use_tls }))}
          className={`w-10 h-5 rounded-full transition-colors relative ${form.email_use_tls ? "bg-amber-500" : "bg-gray-200"}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.email_use_tls ? "translate-x-5" : ""}`} />
        </div>
        <span className="text-sm text-gray-700">{isBn ? "TLS সক্রিয় (সুপারিশকৃত)" : "Use TLS (recommended)"}</span>
      </label>
      <button onClick={handleSave} disabled={isLoading} className="btn-primary">
        {isLoading ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save Changes")}
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const [active, setActive] = useState<SectionId>("general");

  const { data: settings, isLoading } = useGetSiteSettingsQuery();

  const activeMenu = MENU.find(m => m.id === active)!;

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <PageHeader
        title={isBn ? "সেটিং" : "Settings"}
        description={isBn ? "সিস্টেম কনফিগারেশন ও পছন্দ পরিচালনা করুন" : "Manage system configuration and preferences"}
      />

      <div className="flex gap-4">
        {/* Left menu */}
        <aside className="w-48 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 space-y-0.5">
            {MENU.map(item => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                  active === item.id
                    ? "bg-amber-50 text-amber-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                {item.icon}
                {isBn ? item.label_bn : item.label_en}
              </button>
            ))}
          </div>
        </aside>

        {/* Right content */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-5 pb-3 border-b border-gray-100">
            {isBn ? activeMenu.label_bn : activeMenu.label_en}
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : settings ? (
            <>
              {active === "general" && <GeneralPanel settings={settings} isBn={isBn} />}
              {active === "invoice" && <InvoicePanel settings={settings} isBn={isBn} />}
              {active === "mail"    && <MailPanel    settings={settings} isBn={isBn} />}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useGetCategoriesQuery, useUpdateCategoryMutation } from "@/api/categories/categoriesApi";
import { FloatingInput, FloatingTextarea } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { toast } from "@/store/toastStore";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditCategorySeoPage({ params }: { params: { id: string } }) {
  const t = useTranslations();
  const locale = useLocale();
  const isBn = locale === "bn";
  const router = useRouter();

  const { data: categories = [], isLoading } = useGetCategoriesQuery({ includeInactive: true });
  const category = categories.find(c => c.id === params.id);
  const [updateCategory, { isLoading: saving }] = useUpdateCategoryMutation();

  const [form, setForm] = useState({
    seo_title_bn: "",
    seo_title_en: "",
    meta_description_bn: "",
    meta_description_en: "",
    description_bn: "",
    description_en: "",
  });

  useEffect(() => {
    if (category) {
      setForm({
        seo_title_bn: category.seo_title_bn,
        seo_title_en: category.seo_title_en,
        meta_description_bn: category.meta_description_bn,
        meta_description_en: category.meta_description_en,
        description_bn: category.description_bn,
        description_en: category.description_en,
      });
    }
  }, [category]);

  const f = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    try {
      await updateCategory({ id: params.id, ...form }).unwrap();
      toast.success(isBn ? "সংরক্ষণ হয়েছে" : "Saved");
      router.push(`/${locale}/admin/categories`);
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed to save");
    }
  };

  if (isLoading) return <Spinner />;
  if (!category) return <p className="text-gray-400">{isBn ? "কেটাগরি পাওয়া যায়নি" : "Category not found"}</p>;

  return (
    <div className="max-w-7xl">
      <PageHeader
        title={isBn ? `এসইও ও বিবরণ — ${category.name_bn}` : `SEO & Description — ${category.name_en}`}
        description={isBn ? "কেটাগরি পেজের এসইও শিরোনাম, মেটা বিবরণ ও বিস্তারিত বিবরণ যোগ করুন" : "Add SEO title, meta description, and long-form description for this category page"}
        showBack
        backHref={`/${locale}/admin/categories`}
      />

      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FloatingInput label={isBn ? "এসইও শিরোনাম (বাংলা)" : "SEO Title (Bangla)"} value={form.seo_title_bn} onChange={f("seo_title_bn")} maxLength={70} />
          <FloatingInput label={isBn ? "এসইও শিরোনাম (English)" : "SEO Title (English)"} value={form.seo_title_en} onChange={f("seo_title_en")} maxLength={70} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FloatingTextarea label={isBn ? "মেটা বিবরণ (বাংলা)" : "Meta Description (Bangla)"} value={form.meta_description_bn} onChange={f("meta_description_bn")} rows={2} maxLength={170} />
          <FloatingTextarea label={isBn ? "মেটা বিবরণ (English)" : "Meta Description (English)"} value={form.meta_description_en} onChange={f("meta_description_en")} rows={2} maxLength={170} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FloatingTextarea label={isBn ? "বিস্তারিত বিবরণ (বাংলা)" : "Description (Bangla)"} value={form.description_bn} onChange={f("description_bn")} rows={6} />
          <FloatingTextarea label={isBn ? "বিস্তারিত বিবরণ (English)" : "Description (English)"} value={form.description_en} onChange={f("description_en")} rows={6} />
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? t("common.loading") : t("common.save")}
          </button>
          <button onClick={() => router.back()} className="btn-secondary">{t("common.cancel")}</button>
        </div>
      </div>
    </div>
  );
}

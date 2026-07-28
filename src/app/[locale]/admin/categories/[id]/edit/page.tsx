"use client";

import { useGetCategoriesQuery, useUpdateCategoryMutation } from "@/api/categories/categoriesApi";
import { FloatingInput, FloatingTextarea } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { CategoryFAQ } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const EMPTY_FAQ: CategoryFAQ = { question_bn: "", question_en: "", answer_bn: "", answer_en: "" };

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
  const [faqs, setFaqs] = useState<CategoryFAQ[]>([]);

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
      setFaqs(category.faqs?.length ? category.faqs : []);
    }
  }, [category]);

  const f = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  const updateFaq = (idx: number, key: keyof CategoryFAQ, value: string) =>
    setFaqs(prev => prev.map((faq, i) => (i === idx ? { ...faq, [key]: value } : faq)));

  const addFaq = () => setFaqs(prev => [...prev, { ...EMPTY_FAQ }]);
  const removeFaq = (idx: number) => setFaqs(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    try {
      await updateCategory({
        id: params.id,
        ...form,
        faqs: faqs.filter(f => f.question_bn || f.question_en),
      }).unwrap();
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
        description={isBn ? "কেটাগরি পেজের এসইও শিরোনাম, মেটা বিবরণ, বিস্তারিত বিবরণ ও FAQ যোগ করুন" : "Add SEO title, meta description, long-form description and FAQs for this category page"}
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

        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600">FAQ</h3>
            <button type="button" onClick={addFaq} className="inline-flex items-center gap-1 text-xs text-amber-600 hover:underline">
              <Plus className="w-3.5 h-3.5" /> {isBn ? "প্রশ্ন যোগ করুন" : "Add Question"}
            </button>
          </div>

          {faqs.length === 0 ? (
            <p className="text-sm text-gray-400">{isBn ? "কোনো FAQ নেই" : "No FAQs yet"}</p>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                    <button type="button" onClick={() => removeFaq(idx)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FloatingInput label={isBn ? "প্রশ্ন (বাংলা)" : "Question (Bangla)"} value={faq.question_bn} onChange={e => updateFaq(idx, "question_bn", e.target.value)} />
                    <FloatingInput label={isBn ? "প্রশ্ন (English)" : "Question (English)"} value={faq.question_en} onChange={e => updateFaq(idx, "question_en", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FloatingTextarea label={isBn ? "উত্তর (বাংলা)" : "Answer (Bangla)"} value={faq.answer_bn} onChange={e => updateFaq(idx, "answer_bn", e.target.value)} rows={2} />
                    <FloatingTextarea label={isBn ? "উত্তর (English)" : "Answer (English)"} value={faq.answer_en} onChange={e => updateFaq(idx, "answer_en", e.target.value)} rows={2} />
                  </div>
                </div>
              ))}
            </div>
          )}
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

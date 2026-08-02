"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { FloatingInput, FloatingTextarea, ToggleSwitch } from "@/components/ui/forms";
import TiptapEditor from "@/components/admin/blog/TiptapEditor";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { toast } from "@/store/toastStore";
import { getErrorMessage, getFieldErrors } from "@/utils/apiError";
import { useGetBlogPostQuery, useUpdateBlogPostMutation } from "@/api/blog/blogApi";

export default function EditBlogPostPage({ params }: { params: { id: string } }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: post, isLoading } = useGetBlogPostQuery(params.id);
  const [updateBlogPost, { isLoading: saving }] = useUpdateBlogPostMutation();

  const [form, setForm] = useState({
    title_bn: "",
    title_en: "",
    seo_title_bn: "",
    seo_title_en: "",
    meta_description_bn: "",
    meta_description_en: "",
    focus_keyword: "",
    canonical_url: "",
    body_bn: "",
    body_en: "",
    is_active: true,
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [clearCover, setClearCover] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (post) {
      setForm({
        title_bn: post.title_bn,
        title_en: post.title_en,
        seo_title_bn: post.seo_title_bn,
        seo_title_en: post.seo_title_en,
        meta_description_bn: post.meta_description_bn,
        meta_description_en: post.meta_description_en,
        focus_keyword: post.focus_keyword,
        canonical_url: post.canonical_url,
        body_bn: post.body_bn,
        body_en: post.body_en,
        is_active: post.is_active,
      });
      setCoverPreview(post.cover_image);
    }
  }, [post]);

  const f =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  const handleUpdate = async () => {
    setFieldErrors({});
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (coverFile) fd.append("cover_image", coverFile);
      else if (clearCover) fd.append("clear_cover_image", "1");
      await updateBlogPost({ id: params.id, data: fd }).unwrap();
      toast.success(locale === "bn" ? "পোস্ট আপডেট হয়েছে" : "Post updated");
      router.push(`/${locale}/admin/blog`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
      setFieldErrors(getFieldErrors(err));
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={`${t("common.edit")} ${locale === "bn" ? "ব্লগ পোস্ট" : "Blog Post"}`}
        description={locale === "bn" ? "পোস্টের তথ্য ও বিষয়বস্তু আপডেট করুন" : "Update post details and content"}
        showBack
        backHref={`/${locale}/admin/blog`}
        backLabel={t("common.cancel")}
      />

      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FloatingInput label="শিরোনাম (বাংলা) *" value={form.title_bn} onChange={f("title_bn")} error={fieldErrors.title_bn} />
          <FloatingInput label="Title (English) *" value={form.title_en} onChange={f("title_en")} error={fieldErrors.title_en} />
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">
            {locale === "bn" ? "কভার ছবি (ঐচ্ছিক)" : "Cover Image (optional)"}
          </p>
          <div className="flex items-center gap-3">
            {coverPreview && (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPreview} alt="Preview" className="w-24 h-16 object-cover rounded-lg border border-gray-200" />
                <button
                  type="button"
                  onClick={() => { setCoverPreview(null); setCoverFile(null); setClearCover(true); }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-xs px-3 py-1.5">
              {locale === "bn" ? "+ ছবি বেছে নিন" : "+ Choose Image"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                setCoverFile(file);
                setClearCover(false);
                setCoverPreview(URL.createObjectURL(file));
              }}
            />
          </div>
        </div>

        <TiptapEditor
          label={locale === "bn" ? "বিষয়বস্তু (বাংলা)" : "Body (Bangla)"}
          value={form.body_bn}
          onChange={html => setForm(p => ({ ...p, body_bn: html }))}
        />
        <TiptapEditor
          label={locale === "bn" ? "বিষয়বস্তু (English)" : "Body (English)"}
          value={form.body_en}
          onChange={html => setForm(p => ({ ...p, body_en: html }))}
        />

        <ToggleSwitch
          checked={form.is_active}
          onChange={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
          activeLabel={locale === "bn" ? "প্রকাশিত" : "Published"}
          inactiveLabel={locale === "bn" ? "খসড়া" : "Draft"}
        />

        <div className="pt-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">
            {locale === "bn" ? "এসইও (ঐচ্ছিক)" : "SEO (optional)"}
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FloatingInput label={locale === "bn" ? "এসইও শিরোনাম (বাংলা)" : "SEO Title (Bangla)"} value={form.seo_title_bn} onChange={f("seo_title_bn")} maxLength={70} />
              <FloatingInput label={locale === "bn" ? "এসইও শিরোনাম (English)" : "SEO Title (English)"} value={form.seo_title_en} onChange={f("seo_title_en")} maxLength={70} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FloatingTextarea label={locale === "bn" ? "মেটা বিবরণ (বাংলা)" : "Meta Description (Bangla)"} value={form.meta_description_bn} onChange={f("meta_description_bn")} rows={2} maxLength={170} />
              <FloatingTextarea label={locale === "bn" ? "মেটা বিবরণ (English)" : "Meta Description (English)"} value={form.meta_description_en} onChange={f("meta_description_en")} rows={2} maxLength={170} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FloatingInput label={locale === "bn" ? "ফোকাস কীওয়ার্ড" : "Focus Keyword"} value={form.focus_keyword} onChange={f("focus_keyword")} />
              <FloatingInput label={locale === "bn" ? "ক্যানোনিক্যাল URL" : "Canonical URL"} value={form.canonical_url} onChange={f("canonical_url")} placeholder="https://pujarighar.com/blog/..." />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleUpdate} disabled={saving} className="btn-primary">
            {saving ? t("common.loading") : t("common.save")}
          </button>
          <button onClick={() => router.back()} className="btn-secondary">
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useGetBrandsQuery } from "@/api/brands/brandsApi";
import { useGetCategoriesQuery } from "@/api/categories/categoriesApi";
import {
  useAddProductImagesMutation,
  useDeleteProductImageMutation,
  useGetProductQuery,
  useUpdateProductMutation,
} from "@/api/products/productsApi";
import ImageUpload from "@/components/ui/ImageUpload";
import {
  FloatingInput,
  FloatingSelect,
  FloatingTextarea,
  ToggleSwitch,
} from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { toast } from "@/store/toastStore";
import { getErrorMessage } from "@/utils/apiError";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const t      = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const { data: product, isLoading } = useGetProductQuery(params.id);
  const { data: categories = [] }    = useGetCategoriesQuery();
  const { data: brands = [] }        = useGetBrandsQuery();
  const [updateProduct, { isLoading: saving }] = useUpdateProductMutation();
  const [addImages]   = useAddProductImagesMutation();
  const [deleteImage] = useDeleteProductImageMutation();

  const [form, setForm] = useState({
    name_bn: "",
    name_en: "",
    description_bn: "",
    description_en: "",
    unit_bn: "",
    unit_en: "",
    category: "",
    brand: "",
    is_active: true,
    seo_title_bn: "",
    seo_title_en: "",
    meta_description_bn: "",
    meta_description_en: "",
    focus_keyword: "",
    canonical_url: "",
  });

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  useEffect(() => {
    if (product) {
      setForm({
        name_bn:        product.name_bn,
        name_en:        product.name_en,
        description_bn: product.description_bn,
        description_en: product.description_en,
        unit_bn:        product.unit_bn,
        unit_en:        product.unit_en,
        category:       product.category,
        brand:          product.brand ?? "",
        is_active:      product.is_active,
        seo_title_bn:         product.seo_title_bn,
        seo_title_en:         product.seo_title_en,
        meta_description_bn: product.meta_description_bn,
        meta_description_en: product.meta_description_en,
        focus_keyword:        product.focus_keyword,
        canonical_url:        product.canonical_url,
      });
    }
  }, [product]);

  const handleUpdate = async () => {
    try {
      await updateProduct({ id: params.id, ...form }).unwrap();
      if (pendingFiles.length > 0) {
        await addImages({ productId: params.id, files: pendingFiles }).unwrap();
      }
      toast.success(locale === "bn" ? "পণ্য আপডেট হয়েছে" : "Product updated");
      router.push(`/${locale}/admin/products`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  if (isLoading) return <Spinner />;

  const f = (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <div className="max-w-7xl">
      <PageHeader
        title={`${t("common.edit")} ${t("product.title")}`}
        description={locale === "bn" ? "পণ্যের তথ্য, ছবি ও স্টক আপডেট করুন" : "Update product details, images and stock"}
        showBack
        backHref={`/${locale}/admin/products`}
        backLabel={t("common.cancel")}
      />

      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FloatingInput label="নাম (বাংলা)"      value={form.name_bn} onChange={f("name_bn")} />
          <FloatingInput label="Name (English)"    value={form.name_en} onChange={f("name_en")} />
          <FloatingSelect
            label={t("product.category")}
            value={form.category}
            onChange={val => setForm(p => ({ ...p, category: val }))}
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {locale === "bn" ? c.name_bn : c.name_en}
              </option>
            ))}
          </FloatingSelect>
          <FloatingSelect
            label={locale === "bn" ? "ব্র্যান্ড (ঐচ্ছিক)" : "Brand (optional)"}
            value={form.brand}
            onChange={val => setForm(p => ({ ...p, brand: val }))}
            showClearButton={!!form.brand}
            onClear={() => setForm(p => ({ ...p, brand: "" }))}
          >
            <option value="">{locale === "bn" ? "ব্র্যান্ড নির্বাচন করুন" : "Select brand"}</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>
                {locale === "bn" ? b.name_bn : b.name_en}
              </option>
            ))}
          </FloatingSelect>
        </div>

        <FloatingTextarea
          label={`${t("product.description")} (বাংলা)`}
          value={form.description_bn}
          onChange={f("description_bn")}
          rows={3}
        />
        <FloatingTextarea
          label={`${t("product.description")} (English)`}
          value={form.description_en}
          onChange={f("description_en")}
          rows={3}
        />

        <ToggleSwitch
          checked={form.is_active}
          onChange={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
          activeLabel={t("common.active")}
          inactiveLabel={t("common.inactive")}
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
              <FloatingInput label={locale === "bn" ? "ক্যানোনিক্যাল URL" : "Canonical URL"} value={form.canonical_url} onChange={f("canonical_url")} placeholder="https://pujarighar.com/products/..." />
            </div>
          </div>
        </div>

        <ImageUpload
          existingImages={product?.images ?? []}
          onDeleteExisting={imageId => deleteImage({ productId: params.id, imageId })}
          onFilesChange={setPendingFiles}
          maxImages={5}
        />

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

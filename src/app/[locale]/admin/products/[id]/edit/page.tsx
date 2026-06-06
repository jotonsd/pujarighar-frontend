"use client";

import { useGetCategoriesQuery } from "@/api/categories/categoriesApi";
import {
    useAddProductImageMutation,
    useDeleteProductImageMutation,
    useGetProductQuery,
    useUpdateProductMutation,
} from "@/api/products/productsApi";
import {
    FloatingInput,
    FloatingSelect,
    FloatingTextarea,
    ToggleSwitch,
} from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { toast } from "@/store/toastStore";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const { data: product, isLoading } = useGetProductQuery(params.id);
  const { data: categories = [] } = useGetCategoriesQuery();
  const [updateProduct, { isLoading: saving }] = useUpdateProductMutation();
  const [addImage] = useAddProductImageMutation();
  const [deleteImage] = useDeleteProductImageMutation();

  const [form, setForm] = useState({
    name_bn: "",
    name_en: "",
    description_bn: "",
    description_en: "",
    unit_bn: "",
    unit_en: "",
    category: "",
    is_active: true,
  });

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setForm({
        name_bn: product.name_bn,
        name_en: product.name_en,
        description_bn: product.description_bn,
        description_en: product.description_en,
        unit_bn: product.unit_bn,
        unit_en: product.unit_en,
        category: product.category,
        is_active: product.is_active,
      });
    }
  }, [product]);

  const existingCount = product?.images?.length ?? 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (existingCount + pendingFiles.length >= 3) return;
    setPendingFiles(p => [...p, file]);
    setPreviewUrls(p => [...p, URL.createObjectURL(file)]);
    e.target.value = "";
  };

  const removePending = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPendingFiles(p => p.filter((_, i) => i !== index));
    setPreviewUrls(p => p.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    try {
      await updateProduct({ id: params.id, ...form }).unwrap();

      for (const file of pendingFiles) {
        const fd = new FormData();
        fd.append("image", file);
        await addImage({ productId: params.id, formData: fd }).unwrap();
      }

      toast.success(locale === "bn" ? "পণ্য আপডেট হয়েছে" : "Product updated");
      router.push(`/${locale}/admin/products`);
    } catch (err: unknown) {
      const e = err as {
        data?: { error?: { message_en?: string; message_bn?: string } };
      };
      toast.error(
        locale === "bn"
          ? (e.data?.error?.message_bn ?? "আপডেট ব্যর্থ হয়েছে")
          : (e.data?.error?.message_en ?? "Update failed"),
      );
    }
  };

  if (isLoading) return <Spinner />;

  const existingImages = product?.images ?? [];
  const totalImages = existingCount + pendingFiles.length;
  const f =
    (key: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm({ ...form, [key]: e.target.value });

  return (
    <div className="max-w-7xl">
      <PageHeader
        title={`${t("common.edit")} ${t("product.title")}`}
        showBack
        backHref={`/${locale}/admin/products`}
        backLabel={t("common.cancel")}
      />

      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FloatingInput
            label="নাম (বাংলা)"
            value={form.name_bn}
            onChange={f("name_bn")}
          />
          <FloatingInput
            label="Name (English)"
            value={form.name_en}
            onChange={f("name_en")}
          />
        </div>
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
          onChange={() => setForm({ ...form, is_active: !form.is_active })}
          activeLabel={t("common.active")}
          inactiveLabel={t("common.inactive")}
        />

        {/* ── Images ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("product.images")}
              <span className="ml-2 text-xs text-gray-400">
                {totalImages}/3
              </span>
            </label>
            {totalImages < 3 && (
              <>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="btn-secondary text-xs px-3 py-1"
                >
                  {locale === "bn" ? "+ ছবি যোগ করুন" : "+ Add Image"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>

          {totalImages === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
              {locale === "bn" ? "কোনো ছবি নেই" : "No images yet"}
            </p>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {existingImages.map((img, i) => (
                <div
                  key={img.id}
                  className="relative group w-28 h-28 rounded-lg overflow-hidden border border-gray-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image}
                    alt={img.alt_en || `Image ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      deleteImage({ productId: params.id, imageId: img.id })
                    }
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}

              {previewUrls.map((url, i) => (
                <div
                  key={`pending-${i}`}
                  className="relative group w-28 h-28 rounded-lg overflow-hidden border border-amber-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-amber-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/40 text-white text-[10px] px-1 rounded">
                    {locale === "bn" ? "প্রিভিউ" : "Preview"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="btn-primary"
          >
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

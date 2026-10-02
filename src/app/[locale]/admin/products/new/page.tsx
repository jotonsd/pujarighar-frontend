"use client";

import { useGetBrandsQuery } from "@/api/brands/brandsApi";
import { useGetCategoriesQuery } from "@/api/categories/categoriesApi";
import {
    useAddProductImagesMutation,
    useCreateProductMutation,
    useGetProductQuery,
} from "@/api/products/productsApi";
import {
    FloatingInput,
    FloatingSelect,
    FloatingTextarea,
} from "@/components/ui/forms";
import BadgePicker from "@/components/admin/products/BadgePicker";
import ImageUpload from "@/components/ui/ImageUpload";
import PageHeader from "@/components/ui/PageHeader";
import { ProductBadge } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { getErrorMessage, getFieldErrors } from "@/utils/apiError";
import { RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function generateSku(name: string): string {
  const prefix = name
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3)
    .padEnd(3, "X");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `PG-${prefix}-${suffix}`;
}

// A duplicated product can't keep the source's SKU (DB-unique) — suggest a
// clearly-derived variant instead, which the admin can still edit or
// regenerate (via regenerateSku) before saving.
function suggestDuplicateSku(sourceSku: string): string {
  const suffix = Math.floor(10 + Math.random() * 90);
  return `${sourceSku}-COPY${suffix}`;
}

async function urlToFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}

export default function NewProductPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState({
    name_bn: "",
    name_en: "",
    description_bn: "",
    description_en: "",
    sku: "",
    category: "",
    brand: "",
    unit_bn: "পিস",
    unit_en: "piece",
    weight_kg: "",
    seo_title_bn: "",
    seo_title_en: "",
    meta_description_bn: "",
    meta_description_en: "",
    focus_keyword: "",
    canonical_url: "",
    badges: [] as ProductBadge[],
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const skuManualRef = useRef(false);

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brands = [] } = useGetBrandsQuery();
  const [createProduct, { isLoading }] = useCreateProductMutation();
  const [addImages] = useAddProductImagesMutation();

  // Duplicate-from-existing-product flow: /admin/products/new?duplicateFrom=<id>
  const duplicateFromId = useSearchParams().get("duplicateFrom");
  const { data: sourceProduct } = useGetProductQuery(duplicateFromId!, { skip: !duplicateFromId });
  const [duplicateImageFiles, setDuplicateImageFiles] = useState<File[]>([]);
  // Images carry over as actual re-uploadable files (fetched from the source
  // product's existing image URLs) — there's no "copy by reference" on the
  // backend, only upload-new/delete-existing. We delay rendering ImageUpload
  // until this is settled so its initialFiles seed is correct on first mount.
  const [imagesReady, setImagesReady] = useState(!duplicateFromId);

  useEffect(() => {
    if (!sourceProduct) return;
    skuManualRef.current = true;
    setForm({
      name_bn: sourceProduct.name_bn,
      name_en: sourceProduct.name_en,
      description_bn: sourceProduct.description_bn ?? "",
      description_en: sourceProduct.description_en ?? "",
      sku: suggestDuplicateSku(sourceProduct.sku),
      category: String(sourceProduct.category ?? ""),
      brand: sourceProduct.brand ? String(sourceProduct.brand) : "",
      unit_bn: sourceProduct.unit_bn ?? "পিস",
      unit_en: sourceProduct.unit_en ?? "piece",
      weight_kg: sourceProduct.weight_kg != null ? String(sourceProduct.weight_kg) : "",
      seo_title_bn: sourceProduct.seo_title_bn ?? "",
      seo_title_en: sourceProduct.seo_title_en ?? "",
      meta_description_bn: sourceProduct.meta_description_bn ?? "",
      meta_description_en: sourceProduct.meta_description_en ?? "",
      focus_keyword: sourceProduct.focus_keyword ?? "",
      // Not carried over — a canonical URL must point to one real product;
      // copying it would make the duplicate claim the original's URL.
      canonical_url: "",
      badges: sourceProduct.badges ?? [],
    });

    (async () => {
      try {
        const files = await Promise.all(
          (sourceProduct.images ?? []).map((img, i) =>
            urlToFile(img.image, `duplicate-${i + 1}.jpg`),
          ),
        );
        setDuplicateImageFiles(files);
        setPendingFiles(files);
      } catch {
        // Source images failed to fetch (e.g. CORS/network) — not fatal,
        // the admin can just upload images fresh.
      } finally {
        setImagesReady(true);
      }
    })();
  }, [sourceProduct]);

  const handleCreate = async () => {
    setFieldErrors({});
    try {
      const product = await createProduct(form).unwrap();
      if (pendingFiles.length > 0) {
        await addImages({ productId: product.id, files: pendingFiles }).unwrap();
      }
      toast.success(locale === "bn" ? "পণ্য তৈরি হয়েছে" : "Product created");
      router.push(`/${locale}/admin/products`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
      setFieldErrors(getFieldErrors(err));
    }
  };

  const f =
    (key: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  const handleNameEnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm(p => ({
      ...p,
      name_en: name,
      ...(!skuManualRef.current && { sku: name ? generateSku(name) : "" }),
    }));
  };

  const regenerateSku = () => {
    skuManualRef.current = false;
    setForm(p => ({
      ...p,
      sku: p.name_en ? generateSku(p.name_en) : generateSku("PG"),
    }));
  };

  return (
    <div className="max-w-7xl">
      <PageHeader
        title={duplicateFromId ? (locale === 'bn' ? 'পণ্য কপি করুন' : 'Duplicate Product') : `${t("common.create")} ${t("product.title")}`}
        description={
          duplicateFromId
            ? (locale === 'bn' ? 'তথ্য পূরণ করা আছে — প্রয়োজন অনুযায়ী পরিবর্তন করুন' : 'Pre-filled from the original — edit anything before saving')
            : (locale === 'bn' ? 'ক্যাটালগে নতুন পণ্য যোগ করুন' : 'Add a new product to your catalog')
        }
        showBack
      />
      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FloatingInput
            label="নাম (বাংলা)"
            required
            value={form.name_bn}
            onChange={f("name_bn")}
            error={fieldErrors.name_bn}
          />
          <FloatingInput
            label="Name (English)"
            required
            value={form.name_en}
            onChange={handleNameEnChange}
            error={fieldErrors.name_en}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex gap-2 items-start">
            <FloatingInput
              label={t("product.sku")}
              required
              value={form.sku}
              onChange={e => {
                skuManualRef.current = true;
                f("sku")(e);
              }}
              error={fieldErrors.sku}
              className="flex-1"
            />
            <button
              type="button"
              onClick={regenerateSku}
              title={locale === "bn" ? "পুনরায় তৈরি করুন" : "Regenerate SKU"}
              className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-border text-muted hover:text-amber-700 hover:border-amber-400 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <FloatingSelect
            label={t("product.category")}
            value={form.category}
            onChange={val => setForm(p => ({ ...p, category: val }))}
            error={fieldErrors.category}
          >
            <option value="">
              {locale === "bn" ? "কেটাগরি নির্বাচন করুন" : "Select category"}
            </option>
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
            error={fieldErrors.brand}
          >
            <option value="">{locale === "bn" ? "ব্র্যান্ড নির্বাচন করুন" : "Select brand"}</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>
                {locale === "bn" ? b.name_bn : b.name_en}
              </option>
            ))}
          </FloatingSelect>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FloatingInput
            label={`${t("product.unit")} (বাংলা)`}
            value={form.unit_bn}
            onChange={f("unit_bn")}
          />
          <FloatingInput
            label={`${t("product.unit")} (English)`}
            value={form.unit_en}
            onChange={f("unit_en")}
          />
          <FloatingInput
            label={locale === "bn" ? "ওজন (কেজি, ঐচ্ছিক)" : "Weight (kg, optional)"}
            type="number"
            min="0"
            step="0.001"
            value={form.weight_kg}
            onChange={f("weight_kg")}
            error={fieldErrors.weight_kg}
          />
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

        <BadgePicker
          value={form.badges}
          onChange={badges => setForm(p => ({ ...p, badges }))}
          locale={locale}
        />

        <div className="pt-2 border-t border-border">
          <h3 className="text-sm font-semibold text-muted mb-3">
            {locale === "bn" ? "এসইও (ঐচ্ছিক)" : "SEO (optional)"}
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FloatingInput label={locale === "bn" ? "এসইও শিরোনাম (বাংলা)" : "SEO Title (Bangla)"} value={form.seo_title_bn} onChange={f("seo_title_bn")} maxLength={70} error={fieldErrors.seo_title_bn} />
              <FloatingInput label={locale === "bn" ? "এসইও শিরোনাম (English)" : "SEO Title (English)"} value={form.seo_title_en} onChange={f("seo_title_en")} maxLength={70} error={fieldErrors.seo_title_en} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FloatingTextarea label={locale === "bn" ? "মেটা বিবরণ (বাংলা)" : "Meta Description (Bangla)"} value={form.meta_description_bn} onChange={f("meta_description_bn")} rows={2} maxLength={170} error={fieldErrors.meta_description_bn} />
              <FloatingTextarea label={locale === "bn" ? "মেটা বিবরণ (English)" : "Meta Description (English)"} value={form.meta_description_en} onChange={f("meta_description_en")} rows={2} maxLength={170} error={fieldErrors.meta_description_en} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FloatingInput label={locale === "bn" ? "ফোকাস কীওয়ার্ড" : "Focus Keyword"} value={form.focus_keyword} onChange={f("focus_keyword")} maxLength={150} error={fieldErrors.focus_keyword} />
              <FloatingInput label={locale === "bn" ? "ক্যানোনিক্যাল URL" : "Canonical URL"} value={form.canonical_url} onChange={f("canonical_url")} placeholder="https://pujarighar.com/products/..." maxLength={500} error={fieldErrors.canonical_url} />
            </div>
          </div>
        </div>

        {imagesReady ? (
          <ImageUpload
            onFilesChange={setPendingFiles}
            maxImages={5}
            initialFiles={duplicateImageFiles}
          />
        ) : (
          <p className="text-sm text-muted">
            {locale === "bn" ? "ছবি লোড হচ্ছে..." : "Loading images..."}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCreate}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? t("common.loading") : t("common.create")}
          </button>
          <button onClick={() => router.back()} className="btn-secondary">
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

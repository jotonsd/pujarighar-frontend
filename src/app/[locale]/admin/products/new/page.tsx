"use client";

import { useGetBrandsQuery } from "@/api/brands/brandsApi";
import { useGetCategoriesQuery } from "@/api/categories/categoriesApi";
import {
    useAddProductImagesMutation,
    useCreateProductMutation,
} from "@/api/products/productsApi";
import {
    FloatingInput,
    FloatingSelect,
    FloatingTextarea,
} from "@/components/ui/forms";
import ImageUpload from "@/components/ui/ImageUpload";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "@/store/toastStore";
import { RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

function generateSku(name: string): string {
  const prefix = name
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3)
    .padEnd(3, "X");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `PG-${prefix}-${suffix}`;
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
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const skuManualRef = useRef(false);

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brands = [] } = useGetBrandsQuery();
  const [createProduct, { isLoading }] = useCreateProductMutation();
  const [addImages] = useAddProductImagesMutation();

  const handleCreate = async () => {
    try {
      const product = await createProduct(form).unwrap();
      if (pendingFiles.length > 0) {
        await addImages({ productId: product.id, files: pendingFiles }).unwrap();
      }
      toast.success(locale === "bn" ? "পণ্য তৈরি হয়েছে" : "Product created");
      router.push(`/${locale}/admin/products`);
    } catch (err: unknown) {
      const e = err as {
        data?: { error?: { message_en?: string; message_bn?: string } };
      };
      toast.error(
        locale === "bn"
          ? (e.data?.error?.message_bn ?? "ব্যর্থ")
          : (e.data?.error?.message_en ?? "Failed"),
      );
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
        title={`${t("common.create")} ${t("product.title")}`}
        description={locale === 'bn' ? 'ক্যাটালগে নতুন পণ্য যোগ করুন' : 'Add a new product to your catalog'}
        showBack
      />
      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FloatingInput
            label="নাম (বাংলা)"
            required
            value={form.name_bn}
            onChange={f("name_bn")}
          />
          <FloatingInput
            label="Name (English)"
            required
            value={form.name_en}
            onChange={handleNameEnChange}
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
              className="flex-1"
            />
            <button
              type="button"
              onClick={regenerateSku}
              title={locale === "bn" ? "পুনরায় তৈরি করুন" : "Regenerate SKU"}
              className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:text-amber-600 hover:border-amber-400 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <FloatingSelect
            label={t("product.category")}
            value={form.category}
            onChange={val => setForm(p => ({ ...p, category: val }))}
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
          >
            <option value="">{locale === "bn" ? "ব্র্যান্ড নির্বাচন করুন" : "Select brand"}</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>
                {locale === "bn" ? b.name_bn : b.name_en}
              </option>
            ))}
          </FloatingSelect>
        </div>
        <div className="grid grid-cols-2 gap-3">
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

        <ImageUpload
          onFilesChange={setPendingFiles}
          maxImages={5}
        />

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

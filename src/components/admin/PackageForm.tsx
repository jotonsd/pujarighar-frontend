"use client";

import { useGetCategoriesQuery } from "@/api/categories/categoriesApi";
import {
    useAddPackageItemMutation,
    useAddProductImagesMutation,
    useCreateProductMutation,
    useDeletePackageItemMutation,
    useDeleteProductImageMutation,
    useGetProductsQuery,
    useUpdateProductMutation,
} from "@/api/products/productsApi";
import {
    FloatingInput,
    FloatingSelect,
    FloatingTextarea,
} from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import { Product } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { formatAmount } from "@/utils/format";
import { Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface PackageItem {
  id?: string;
  component_id: string;
  component_name_bn: string;
  component_name_en: string;
  component_sku: string;
  unit_price: string;
  quantity: number;
}

interface PackageFormProps {
  package?: Product;
  mode: "create" | "edit";
}

export default function PackageForm({ package: pkg, mode }: PackageFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState({
    name_bn: pkg?.name_bn ?? "",
    name_en: pkg?.name_en ?? "",
    description_bn: pkg?.description_bn ?? "",
    description_en: pkg?.description_en ?? "",
    sku: pkg?.sku ?? `PKG-${Date.now().toString(36).toUpperCase()}`,
    category: pkg?.category ?? "",
    discount_type: (pkg?.discount_type ?? "NONE") as
      | "NONE"
      | "PERCENTAGE"
      | "FLAT",
    discount_value: pkg?.discount_value ?? "0",
    is_active: pkg?.is_active ?? true,
  });

  const [items, setItems] = useState<PackageItem[]>(
    pkg?.package_items?.map(i => ({
      id: i.id,
      component_id: i.component_id,
      component_name_bn: i.component_name_bn,
      component_name_en: i.component_name_en,
      component_sku: i.component_sku,
      unit_price: "",
      quantity: Number(i.quantity),
    })) ?? [],
  );

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQty, setSelectedQty] = useState("1");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState(pkg?.images ?? []);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useGetCategoriesQuery({
    includeInactive: true,
  });
  const { data: productsData } = useGetProductsQuery({ page_size: 200 });
  const allProducts = (productsData?.data ?? []).filter(
    p => !p.is_package && p.is_active,
  );

  // Enrich items with unit_price from products list
  useEffect(() => {
    if (!allProducts.length) return;
    setItems(prev =>
      prev.map(item => {
        const prod = allProducts.find(p => p.id === item.component_id);
        return prod ? { ...item, unit_price: prod.unit_price } : item;
      }),
    );
  }, [productsData]);

  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [addPackageItem] = useAddPackageItemMutation();
  const [deletePackageItem] = useDeletePackageItemMutation();
  const [addProductImages] = useAddProductImagesMutation();
  const [deleteProductImage] = useDeleteProductImageMutation();

  const originalTotal = items.reduce(
    (sum, item) => sum + parseFloat(item.unit_price || "0") * item.quantity,
    0,
  );

  const computedFinalPrice = () => {
    if (form.discount_type === "PERCENTAGE") {
      return originalTotal * (1 - parseFloat(form.discount_value || "0") / 100);
    }
    if (form.discount_type === "FLAT") {
      return Math.max(
        0,
        originalTotal - parseFloat(form.discount_value || "0"),
      );
    }
    return originalTotal;
  };

  const addItem = () => {
    if (!selectedProductId) return;
    if (items.find(i => i.component_id === selectedProductId)) {
      toast.error(
        locale === "bn"
          ? "পণ্যটি ইতোমধ্যে যোগ করা হয়েছে"
          : "Product already added",
      );
      return;
    }
    const prod = allProducts.find(p => p.id === selectedProductId);
    if (!prod) return;
    setItems(prev => [
      ...prev,
      {
        component_id: prod.id,
        component_name_bn: prod.name_bn,
        component_name_en: prod.name_en,
        component_sku: prod.sku,
        unit_price: prod.unit_price,
        quantity: Number(selectedQty) || 1,
      },
    ]);
    setSelectedProductId("");
    setSelectedQty("1");
  };

  const removeItem = (component_id: string) =>
    setItems(prev => prev.filter(i => i.component_id !== component_id));

  const updateItemQty = (component_id: string, qty: number) =>
    setItems(prev =>
      prev.map(i =>
        i.component_id === component_id
          ? { ...i, quantity: Math.max(1, qty) }
          : i,
      ),
    );

  const handleSave = async () => {
    if (!form.name_bn || !form.name_en || !form.sku || !form.category) {
      toast.error(
        locale === "bn"
          ? "সব আবশ্যিক ফিল্ড পূরণ করুন"
          : "Fill all required fields",
      );
      return;
    }
    if (items.length === 0) {
      toast.error(
        locale === "bn"
          ? "কমপক্ষে একটি পণ্য যোগ করুন"
          : "Add at least one product",
      );
      return;
    }

    const finalPrice = computedFinalPrice().toFixed(2);

    try {
      let packageId: string;

      if (mode === "create") {
        const created = await createProduct({
          ...form,
          is_package: true,
          unit_price: finalPrice,
          cost_price: "0",
          unit_bn: "সেট",
          unit_en: "set",
        }).unwrap();
        packageId = created.id;

        for (const item of items) {
          await addPackageItem({
            packageId,
            component_id: item.component_id,
            quantity: item.quantity,
          }).unwrap();
        }

        if (imageFile) {
          await addProductImages({
            productId: packageId,
            files: [imageFile],
          }).unwrap();
        }

        toast.success(
          locale === "bn" ? "প্যাকেজ তৈরি হয়েছে" : "Package created",
        );
      } else {
        packageId = pkg!.id;
        await updateProduct({
          id: packageId,
          ...form,
          unit_price: finalPrice,
        }).unwrap();

        // Remove deleted items
        for (const existing of pkg!.package_items ?? []) {
          if (!items.find(i => i.component_id === existing.component_id)) {
            await deletePackageItem({
              packageId,
              itemId: existing.id,
            }).unwrap();
          }
        }
        // Add new items
        for (const item of items) {
          if (
            !pkg!.package_items?.find(e => e.component_id === item.component_id)
          ) {
            await addPackageItem({
              packageId,
              component_id: item.component_id,
              quantity: item.quantity,
            }).unwrap();
          }
        }
        if (imageFile) {
          await addProductImages({
            productId: packageId,
            files: [imageFile],
          }).unwrap();
        }

        toast.success(
          locale === "bn" ? "প্যাকেজ আপডেট হয়েছে" : "Package updated",
        );
      }

      router.push(`/${locale}/admin/packages`);
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
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  const isLoading = creating || updating;

  return (
    <div>
      <PageHeader
        title={
          mode === "create"
            ? locale === "bn"
              ? "নতুন প্যাকেজ"
              : "New Package"
            : locale === "bn"
              ? "প্যাকেজ সম্পাদনা"
              : "Edit Package"
        }
        showBack
        backHref={`/${locale}/admin/packages`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left: Basic info ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
              {locale === "bn" ? "প্যাকেজ তথ্য" : "Package Info"}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <FloatingInput
                label="নাম (বাংলা) *"
                value={form.name_bn}
                onChange={f("name_bn")}
              />
              <FloatingInput
                label="Name (English) *"
                value={form.name_en}
                onChange={f("name_en")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FloatingInput
                label="SKU *"
                value={form.sku}
                onChange={f("sku")}
              />
              <FloatingSelect
                label={locale === "bn" ? "কেটাগরি *" : "Category *"}
                value={form.category}
                onChange={val => setForm(p => ({ ...p, category: val }))}
              >
                <option value="">
                  {locale === "bn" ? "কেটাগরি বেছে নিন" : "Select category"}
                </option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {locale === "bn" ? c.name_bn : c.name_en}
                  </option>
                ))}
              </FloatingSelect>
            </div>
            <FloatingTextarea
              label={`${locale === "bn" ? "বিবরণ" : "Description"} (বাংলা)`}
              value={form.description_bn}
              onChange={f("description_bn")}
              rows={2}
            />
            <FloatingTextarea
              label={`Description (English)`}
              value={form.description_en}
              onChange={f("description_en")}
              rows={2}
            />
          </div>

          {/* ── Product selector ── */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
              {locale === "bn" ? "প্যাকেজের পণ্য" : "Package Products"}
            </h2>

            {/* Add product row */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <FloatingSelect
                  label={
                    locale === "bn" ? "পণ্য নির্বাচন করুন" : "Select product"
                  }
                  value={selectedProductId}
                  onChange={val => setSelectedProductId(val)}
                  searchable
                  placeholder={locale === "bn" ? "পণ্য বেছে নিন" : "Choose product"}
                  options={allProducts
                    .filter(p => !items.find(i => i.component_id === p.id))
                    .map(p => ({
                      value: p.id,
                      label: `${locale === "bn" ? p.name_bn : p.name_en} - ${formatAmount(p.unit_price, locale, 0)}`,
                      image: p.images?.[0]?.image ?? null,
                    }))}
                />
              </div>
              <div className="w-24">
                <FloatingInput
                  label={locale === "bn" ? "পরিমাণ" : "Qty"}
                  type="number"
                  min="1"
                  value={selectedQty}
                  onChange={e => setSelectedQty(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={addItem}
                disabled={!selectedProductId}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                {locale === "bn" ? "যোগ করুন" : "Add"}
              </button>
            </div>

            {/* Items list */}
            {items.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6 border border-dashed border-gray-200 rounded-lg">
                {locale === "bn"
                  ? "উপরে পণ্য বেছে যোগ করুন"
                  : "Select products above to add"}
              </p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-amber-50 border-b border-amber-200">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-amber-600 uppercase">
                        {locale === "bn" ? "পণ্য" : "Product"}
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-amber-600 uppercase">
                        {locale === "bn" ? "একক মূল্য" : "Unit Price"}
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-amber-600 uppercase">
                        {locale === "bn" ? "পরিমাণ" : "Qty"}
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-amber-600 uppercase">
                        {locale === "bn" ? "মোট" : "Total"}
                      </th>
                      <th className="px-4 py-2.5 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map(item => (
                      <tr key={item.component_id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-800">
                            {locale === "bn"
                              ? item.component_name_bn
                              : item.component_name_en}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            {item.component_sku}
                          </p>
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600">
                          {formatAmount(item.unit_price || "0", locale, 0)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e =>
                              updateItemQty(
                                item.component_id,
                                Number(e.target.value),
                              )
                            }
                            className="w-16 text-center text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-amber-600">
                          {formatAmount(
                            parseFloat(item.unit_price || "0") * item.quantity,
                            locale,
                            0,
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.component_id)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-500 hover:bg-amber-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-2.5 text-sm font-semibold text-gray-700 text-right"
                      >
                        {locale === "bn" ? "মূল মোট" : "Original Total"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-800">
                        {formatAmount(originalTotal, locale, 0)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Discount + Price + Save ── */}
        <div className="space-y-4">
          {/* Discount */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
              {locale === "bn" ? "ছাড়" : "Discount"}
            </h2>
            <FloatingSelect
              label={locale === "bn" ? "ছাড়ের ধরন" : "Discount Type"}
              value={form.discount_type}
              onChange={val =>
                setForm(p => ({
                  ...p,
                  discount_type: val as "NONE" | "PERCENTAGE" | "FLAT",
                }))
              }
            >
              <option value="NONE">
                {locale === "bn" ? "কোনো ছাড় নেই" : "No Discount"}
              </option>
              <option value="PERCENTAGE">
                {locale === "bn" ? "শতাংশ (%)" : "Percentage (%)"}
              </option>
              <option value="FLAT">
                {locale === "bn" ? "নির্দিষ্ট পরিমাণ (৳)" : "Flat Amount (৳)"}
              </option>
            </FloatingSelect>

            {form.discount_type !== "NONE" && (
              <FloatingInput
                label={
                  form.discount_type === "PERCENTAGE"
                    ? locale === "bn"
                      ? "ছাড়ের পরিমাণ (%)"
                      : "Discount (%)"
                    : locale === "bn"
                      ? "ছাড়ের পরিমাণ (৳)"
                      : "Discount Amount (৳)"
                }
                type="number"
                min="0"
                max={form.discount_type === "PERCENTAGE" ? "100" : undefined}
                step="0.01"
                value={form.discount_value}
                onChange={f("discount_value")}
              />
            )}
          </div>

          {/* Price summary */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
              {locale === "bn" ? "মূল্য সারাংশ" : "Price Summary"}
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{locale === "bn" ? "মূল মোট" : "Original"}</span>
                <span>{formatAmount(originalTotal, locale, 0)}</span>
              </div>
              {form.discount_type !== "NONE" && (
                <div className="flex justify-between text-green-600">
                  <span>{locale === "bn" ? "ছাড়" : "Discount"}</span>
                  <span>
                    −{" "}
                    {form.discount_type === "PERCENTAGE"
                      ? `${form.discount_value}% (${formatAmount((originalTotal * parseFloat(form.discount_value || "0")) / 100, locale, 0)})`
                      : formatAmount(form.discount_value, locale, 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2">
                <span>
                  {locale === "bn" ? "চূড়ান্ত মূল্য" : "Final Price"}
                </span>
                <span className="text-amber-600">
                  {formatAmount(computedFinalPrice(), locale, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Image upload */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
              {locale === "bn" ? "ছবি" : "Image"}
            </h2>

            {/* Existing images (edit mode) */}
            {existingImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {existingImages.map(img => (
                  <div key={img.id} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image}
                      alt=""
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await deleteProductImage({
                            productId: pkg!.id,
                            imageId: img.id,
                          }).unwrap();
                          setExistingImages(prev =>
                            prev.filter(i => i.id !== img.id),
                          );
                        } catch {
                          toast.error("Failed to delete image");
                        }
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New image preview */}
            {imagePreview && (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg border border-amber-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-secondary text-xs px-3 py-1.5 w-full"
            >
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
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }}
            />
          </div>

          {/* Active toggle + Save */}
          <div className="card space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e =>
                  setForm(p => ({ ...p, is_active: e.target.checked }))
                }
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-gray-700">
                {t("common.active")}
              </span>
            </label>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || items.length === 0}
              className="btn-primary w-full"
            >
              {isLoading
                ? t("common.loading")
                : mode === "create"
                  ? locale === "bn"
                    ? "প্যাকেজ তৈরি করুন"
                    : "Create Package"
                  : locale === "bn"
                    ? "পরিবর্তন সংরক্ষণ করুন"
                    : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

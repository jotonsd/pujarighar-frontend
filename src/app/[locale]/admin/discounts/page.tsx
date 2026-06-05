"use client";

import {
  useCreateDiscountMutation,
  useDeleteDiscountMutation,
  useGetDiscountsQuery,
  useToggleDiscountMutation,
} from "@/api/discounts/discountsApi";
import { useGetProductsQuery } from "@/api/products/productsApi";
import { FloatingInput, FloatingSelect } from "@/components/ui/forms";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "@/store/toastStore";
import { formatAmount } from "@/utils/format";
import { Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";

export default function DiscountsPage() {
  const locale = useLocale();
  const isBn   = locale === "bn";

  const [form, setForm] = useState({
    product: "",
    discount_type: "PERCENTAGE",
    discount_value: "",
    note: "",
  });

  const { data: products = [] } = useGetProductsQuery({ page_size: 200, include_inactive: false });
  const { data: discounts = [], isLoading } = useGetDiscountsQuery({});
  const [create, { isLoading: creating }] = useCreateDiscountMutation();
  const [toggle] = useToggleDiscountMutation();
  const [remove] = useDeleteDiscountMutation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product || !form.discount_value) return;
    try {
      await create(form).unwrap();
      setForm({ product: "", discount_type: "PERCENTAGE", discount_value: "", note: "" });
      toast.success(isBn ? "ডিসকাউন্ট যোগ হয়েছে" : "Discount created");
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed");
    }
  };

  const handleToggle = async (id: string) => {
    try { await toggle(id).unwrap(); }
    catch { toast.error("Failed"); }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id).unwrap();
      toast.success(isBn ? "মুছে ফেলা হয়েছে" : "Deleted");
    } catch { toast.error("Failed"); }
  };

  const productOptions = products.data ?? [];

  return (
    <div>
      <PageHeader title={isBn ? "ডিসকাউন্ট" : "Discounts"} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Create form */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-700">{isBn ? "নতুন ডিসকাউন্ট" : "New Discount"}</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <FloatingSelect
              label={isBn ? "পণ্য" : "Product"}
              value={form.product}
              onChange={val => setForm(p => ({ ...p, product: val }))}
            >
              <option value="">{isBn ? "পণ্য বেছে নিন" : "Select product"}</option>
              {productOptions.map(p => (
                <option key={p.id} value={p.id}>
                  {isBn ? p.name_bn : p.name_en}
                </option>
              ))}
            </FloatingSelect>

            <FloatingSelect
              label={isBn ? "ছাড়ের ধরন" : "Discount Type"}
              value={form.discount_type}
              onChange={val => setForm(p => ({ ...p, discount_type: val, discount_value: "" }))}
            >
              <option value="PERCENTAGE">{isBn ? "শতাংশ (%)" : "Percentage (%)"}</option>
              <option value="FLAT">{isBn ? "নির্দিষ্ট পরিমাণ (৳)" : "Flat Amount (৳)"}</option>
            </FloatingSelect>

            <FloatingInput
              label={form.discount_type === "PERCENTAGE"
                ? (isBn ? "ছাড় (%)" : "Discount (%)")
                : (isBn ? "ছাড় (৳)" : "Discount (৳)")}
              type="number"
              min="0"
              step="0.01"
              required
              value={form.discount_value}
              onChange={e => setForm(p => ({ ...p, discount_value: e.target.value }))}
            />

            <FloatingInput
              label={isBn ? "নোট (ঐচ্ছিক)" : "Note (optional)"}
              value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
            />

            <button type="submit" disabled={creating} className="btn-primary w-full">
              {creating ? (isBn ? "যোগ হচ্ছে..." : "Adding...") : (isBn ? "ডিসকাউন্ট যোগ করুন" : "Add Discount")}
            </button>
          </form>
        </div>

        {/* Discount list */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <div className="card text-center text-gray-400 py-10">{isBn ? "লোড হচ্ছে..." : "Loading..."}</div>
          ) : discounts.length === 0 ? (
            <div className="card text-center text-gray-400 py-10">
              {isBn ? "কোনো ডিসকাউন্ট নেই" : "No discounts yet"}
            </div>
          ) : (
            discounts.map(d => (
              <div key={d.id} className="card flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {isBn ? d.product_name_bn : d.product_name_en}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">{d.product_sku}</p>
                  <p className="text-sm text-amber-600 font-semibold mt-0.5">
                    {d.discount_type === "PERCENTAGE"
                      ? `${d.discount_value}% ${isBn ? "ছাড়" : "OFF"}`
                      : `${formatAmount(d.discount_value, locale, 0)} ${isBn ? "ছাড়" : "OFF"}`}
                  </p>
                  {d.note && <p className="text-xs text-gray-500 mt-0.5">{d.note}</p>}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(d.created_at).toLocaleDateString(isBn ? "bn-BD" : "en-US")}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <ToggleSwitch
                    checked={d.is_active}
                    onChange={() => handleToggle(d.id)}
                    activeLabel={isBn ? "সক্রিয়" : "Active"}
                    inactiveLabel={isBn ? "নিষ্ক্রিয়" : "Inactive"}
                  />
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

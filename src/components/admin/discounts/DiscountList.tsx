"use client";

import {
  Discount,
  useDeleteDiscountMutation,
  useGetDiscountsQuery,
  useToggleDiscountMutation,
  useUpdateDiscountMutation,
} from "@/api/discounts/discountsApi";
import { useGetCategoriesQuery } from "@/api/categories/categoriesApi";
import { useGetBrandsQuery } from "@/api/brands/brandsApi";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import { Checkbox, FloatingInput, FloatingSelect, FloatingDatePicker } from "@/components/ui/forms";
import { Pencil, Trash2, Truck } from "lucide-react";
import { toast } from "@/store/toastStore";
import { getErrorMessage, getFieldErrors } from "@/utils/apiError";
import { formatAmount, formatDate, formatNumber } from "@/utils/format";
import { useLocale } from "next-intl";
import { useState } from "react";

type EditForm = {
  discount_type: string;
  discount_value: string;
  scope: string;
  free_delivery: boolean;
  note: string;
  start_date: string;
  end_date: string;
};

const SCOPE_LABELS: Record<string, { bn: string; en: string }> = {
  BOTH:       { bn: "অ্যাপ ও ওয়েবসাইট",  en: "App & Website" },
  MOBILE_APP: { bn: "শুধু অ্যাপ",         en: "App Only" },
  WEBSITE:    { bn: "শুধু ওয়েবসাইট",     en: "Website Only" },
};

function EditModal({
  discount,
  isBn,
  onClose,
}: {
  discount: Discount;
  isBn: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<EditForm>({
    discount_type:  discount.discount_type,
    discount_value: discount.discount_value,
    scope:          discount.scope,
    free_delivery:  discount.free_delivery,
    note:           discount.note,
    start_date:     discount.start_date ?? "",
    end_date:       discount.end_date   ?? "",
  });
  const [update, { isLoading }] = useUpdateDiscountMutation();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (key: keyof EditForm, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setFieldErrors({});
  };

  // A discount that's neither a real price cut NOR free delivery does
  // nothing — same rule the backend enforces (DiscountSerializer.validate).
  const valueOrFreeDelivery = (!!form.discount_value && parseFloat(form.discount_value) > 0) || form.free_delivery;

  const handleSave = async () => {
    setFieldErrors({});
    if (!valueOrFreeDelivery) {
      const msg = isBn
        ? "শূন্যের বেশি একটি ছাড়ের পরিমাণ দিন, অথবা ফ্রি ডেলিভারি চালু করুন।"
        : "Enter a discount value greater than 0, or enable Free Delivery.";
      setFieldErrors({ discount_value: msg });
      toast.error(msg);
      return;
    }
    try {
      await update({
        id:             discount.id,
        discount_type:  form.discount_type,
        discount_value: form.discount_value || "0",
        scope:          form.scope,
        free_delivery:  form.free_delivery,
        note:           form.note,
        start_date:     form.start_date || null,
        end_date:       form.end_date   || null,
      }).unwrap();
      toast.success(isBn ? "আপডেট হয়েছে" : "Discount updated");
      onClose();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err, isBn ? "bn" : "en"));
    }
  };

  const startDateObj = form.start_date ? new Date(form.start_date) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-body">
            {isBn ? "ডিসকাউন্ট সম্পাদনা" : "Edit Discount"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-surface-alt hover:text-muted transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 px-3 py-2 bg-background rounded-lg text-xs text-muted">
            {discount.product_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={discount.product_image} alt="" className="w-8 h-8 object-cover rounded-md border border-border shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-md border border-border bg-surface flex items-center justify-center text-muted text-xs shrink-0">—</div>
            )}
            <span>
              {isBn ? "পণ্য: " : "Product: "}
              <span className="font-semibold text-muted">
                {isBn ? discount.product_name_bn : discount.product_name_en}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FloatingSelect
              label={isBn ? "ছাড়ের ধরন" : "Discount Type"}
              value={form.discount_type}
              onChange={val => set("discount_type", val)}
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
              value={form.discount_value}
              onChange={e => set("discount_value", e.target.value)}
              error={fieldErrors.discount_value}
            />

            <FloatingDatePicker
              label={isBn ? "শুরুর তারিখ" : "Start Date"}
              value={form.start_date}
              onChange={val => set("start_date", val)}
              clearable
            />
            <FloatingDatePicker
              label={isBn ? "শেষের তারিখ" : "End Date"}
              value={form.end_date}
              onChange={val => set("end_date", val)}
              minDate={startDateObj}
              clearable
            />
          </div>

          <FloatingSelect
            label={isBn ? "প্রযোজ্য মাধ্যম" : "Applies To"}
            value={form.scope}
            onChange={val => set("scope", val)}
          >
            <option value="BOTH">{isBn ? "অ্যাপ ও ওয়েবসাইট উভয়ই" : "App & Website (Both)"}</option>
            <option value="MOBILE_APP">{isBn ? "শুধু অ্যাপ" : "App Only"}</option>
            <option value="WEBSITE">{isBn ? "শুধু ওয়েবসাইট" : "Website Only"}</option>
          </FloatingSelect>

          <Checkbox
            checked={form.free_delivery}
            onChange={() => setForm(f => ({ ...f, free_delivery: !f.free_delivery }))}
            label={isBn ? "ফ্রি ডেলিভারি (এই পণ্যের ওজন ডেলিভারি চার্জে যুক্ত হবে না)" : "Free delivery (this product's weight won't count toward the delivery charge)"}
          />

          <FloatingInput
            label={isBn ? "নোট (ঐচ্ছিক)" : "Note (optional)"}
            value={form.note}
            onChange={e => set("note", e.target.value)}
          />
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={handleSave} disabled={isLoading || !valueOrFreeDelivery} className="btn-primary flex-1">
            {isLoading
              ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...")
              : (isBn ? "সংরক্ষণ করুন" : "Save Changes")}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            {isBn ? "বাতিল" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ValidityInfo({ d, locale, isBn }: { d: Discount; locale: string; isBn: boolean }) {
  if (!d.start_date && !d.end_date) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const parseLocal = (s: string) => { const [y, m, day] = s.split("-").map(Number); return new Date(y, m - 1, day); };
  const expired = d.end_date && parseLocal(d.end_date) < today;
  const notStarted = d.start_date && parseLocal(d.start_date) > today;
  return (
    <div className="text-xs space-y-0.5">
      {d.start_date && (
        <p className="text-muted">
          {isBn ? "শুরু: " : "From: "}
          <span className="font-medium text-muted">{formatDate(d.start_date, locale)}</span>
        </p>
      )}
      {d.end_date && (
        <p className={expired ? "text-red-500 dark:text-red-400" : "text-muted"}>
          {isBn ? "শেষ: " : "To: "}
          <span className={`font-medium ${expired ? "text-red-700 dark:text-red-400" : "text-muted"}`}>
            {formatDate(d.end_date, locale)}
          </span>
        </p>
      )}
      {(expired || notStarted) && (
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${expired ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" : "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"}`}>
          {expired
            ? (isBn ? "মেয়াদ শেষ" : "Expired")
            : (isBn ? "শুরু হয়নি" : "Not started")}
        </span>
      )}
    </div>
  );
}

function DiscountCard({
  d,
  locale,
  isBn,
  onToggle,
  onEdit,
  onDelete,
}: {
  d: Discount;
  locale: string;
  isBn: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const scopeLabel = SCOPE_LABELS[d.scope] ?? SCOPE_LABELS.BOTH;
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start gap-2.5">
        {d.product_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.product_image} alt="" className="w-11 h-11 object-cover rounded-md border border-border shrink-0" />
        ) : (
          <div className="w-11 h-11 rounded-md border border-border bg-background flex items-center justify-center text-muted text-xs shrink-0">—</div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-body truncate">{isBn ? d.product_name_bn : d.product_name_en}</p>
          <p className="text-xs text-muted font-mono">{d.product_sku}</p>
        </div>
        <ToggleSwitch
          checked={d.is_active}
          onChange={onToggle}
          activeLabel={isBn ? "সক্রিয়" : "Active"}
          inactiveLabel={isBn ? "নিষ্ক্রিয়" : "Inactive"}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-amber-700 dark:text-amber-400">
          {d.discount_type === "PERCENTAGE"
            ? `${formatNumber(d.discount_value, locale)}% ${isBn ? "ছাড়" : "OFF"}`
            : `${formatAmount(d.discount_value, locale, 0)} ${isBn ? "ছাড়" : "OFF"}`}
        </span>
        <div className="flex flex-wrap gap-1 justify-end">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            {isBn ? scopeLabel.bn : scopeLabel.en}
          </span>
          {d.free_delivery && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <Truck className="w-2.5 h-2.5" />
              {isBn ? "ফ্রি ডেলিভারি" : "Free Delivery"}
            </span>
          )}
        </div>
      </div>

      {d.note && <p className="text-sm text-muted">{d.note}</p>}

      <ValidityInfo d={d} locale={locale} isBn={isBn} />

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted">{formatDate(d.created_at, locale)}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
            title={isBn ? "সম্পাদনা" : "Edit"}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            title={isBn ? "মুছুন" : "Delete"}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DiscountList() {
  const locale = useLocale();
  const isBn = locale === "bn";

  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const { data, isLoading, isFetching } = useGetDiscountsQuery({ page, page_size: 12, category, brand });
  const discounts = data?.data ?? [];
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brands = [] } = useGetBrandsQuery();

  const [toggle] = useToggleDiscountMutation();
  const [remove] = useDeleteDiscountMutation();

  const [editTarget, setEditTarget] = useState<Discount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async (id: string) => {
    try {
      await toggle(id).unwrap();
    } catch (err) {
      toast.error(getErrorMessage(err, isBn ? "bn" : "en"));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget.id).unwrap();
      toast.success(isBn ? "মুছে ফেলা হয়েছে" : "Deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, isBn ? "bn" : "en"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FloatingSelect
          label={isBn ? "কেটাগরি" : "Category"}
          value={category}
          onChange={val => { setCategory(val); setPage(1); }}
          showClearButton={!!category}
          onClear={() => { setCategory(""); setPage(1); }}
        >
          <option value="">{isBn ? "সব কেটাগরি" : "All categories"}</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{isBn ? c.name_bn : c.name_en}</option>
          ))}
        </FloatingSelect>
        <FloatingSelect
          label={isBn ? "ব্র্যান্ড" : "Brand"}
          value={brand}
          onChange={val => { setBrand(val); setPage(1); }}
          showClearButton={!!brand}
          onClear={() => { setBrand(""); setPage(1); }}
        >
          <option value="">{isBn ? "সব ব্র্যান্ড" : "All brands"}</option>
          {brands.map(b => (
            <option key={b.id} value={b.id}>{isBn ? b.name_bn : b.name_en}</option>
          ))}
        </FloatingSelect>
      </div>

      {isLoading || isFetching ? (
        <p className="text-center text-sm text-muted py-10">{isBn ? "লোড হচ্ছে..." : "Loading..."}</p>
      ) : discounts.length === 0 ? (
        <p className="text-center text-sm text-muted py-10">{isBn ? "কোনো ডিসকাউন্ট নেই" : "No discounts yet"}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {discounts.map(d => (
            <DiscountCard
              key={d.id}
              d={d}
              locale={locale}
              isBn={isBn}
              onToggle={() => handleToggle(d.id)}
              onEdit={() => setEditTarget(d)}
              onDelete={() => setDeleteTarget(d)}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={data?.pagination?.total_pages ?? 1} onPageChange={setPage} />

      {editTarget && (
        <EditModal
          discount={editTarget}
          isBn={isBn}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          icon="🗑️"
          title={isBn ? "ডিসকাউন্ট মুছবেন?" : "Delete discount?"}
          description={
            isBn
              ? `"${deleteTarget.product_name_bn}"-এর ডিসকাউন্টটি স্থায়ীভাবে মুছে ফেলা হবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।`
              : `The discount on "${deleteTarget.product_name_en}" will be permanently deleted. This cannot be undone.`
          }
          confirmLabel={isBn ? "মুছে ফেলুন" : "Delete"}
          confirmClassName="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

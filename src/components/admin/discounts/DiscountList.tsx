"use client";

import {
  Discount,
  useBulkDeleteDiscountMutation,
  useDeleteDiscountMutation,
  useGetDiscountsQuery,
  useToggleDiscountMutation,
  useUpdateDiscountMutation,
} from "@/api/discounts/discountsApi";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import { FloatingInput, FloatingSelect, FloatingDatePicker } from "@/components/ui/forms";
import {
  Column,
  QuickAction,
  ReusableTable,
} from "@/components/ui/ReusableTable";
import { toast } from "@/store/toastStore";
import { formatAmount, formatDate, formatNumber } from "@/utils/format";
import { Pencil, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";

type EditForm = {
  discount_type: string;
  discount_value: string;
  note: string;
  start_date: string;
  end_date: string;
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
    note:           discount.note,
    start_date:     discount.start_date ?? "",
    end_date:       discount.end_date   ?? "",
  });
  const [update, { isLoading }] = useUpdateDiscountMutation();

  const set = (key: keyof EditForm, val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.discount_value) return;
    try {
      await update({
        id:             discount.id,
        discount_type:  form.discount_type,
        discount_value: form.discount_value,
        note:           form.note,
        start_date:     form.start_date || null,
        end_date:       form.end_date   || null,
      }).unwrap();
      toast.success(isBn ? "আপডেট হয়েছে" : "Discount updated");
      onClose();
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Update failed");
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

          <FloatingInput
            label={isBn ? "নোট (ঐচ্ছিক)" : "Note (optional)"}
            value={form.note}
            onChange={e => set("note", e.target.value)}
          />
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={handleSave} disabled={isLoading} className="btn-primary flex-1">
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

export default function DiscountList() {
  const locale = useLocale();
  const isBn = locale === "bn";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data, isLoading, isFetching } = useGetDiscountsQuery({ page, page_size: limit });
  const discounts = data?.data ?? [];
  const [toggle] = useToggleDiscountMutation();
  const [remove] = useDeleteDiscountMutation();
  const [bulkRemove] = useBulkDeleteDiscountMutation();

  const [editTarget, setEditTarget] = useState<Discount | null>(null);

  const handleToggle = async (id: string) => {
    try {
      await toggle(id).unwrap();
    } catch {
      toast.error("Failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id).unwrap();
      toast.success(isBn ? "মুছে ফেলা হয়েছে" : "Deleted");
    } catch {
      toast.error("Failed");
    }
  };

  const handleBulkDelete = async (ids: (string | number)[]) => {
    try {
      const { deleted } = await bulkRemove(ids as string[]).unwrap();
      toast.success(isBn ? `${deleted}টি ডিসকাউন্ট মুছে ফেলা হয়েছে` : `${deleted} discount(s) deleted`);
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed");
    }
  };

  const columns: Column<Discount>[] = [
    {
      header: isBn ? "পণ্য" : "Product",
      accessor: d => (
        <div className="flex items-center gap-2.5">
          {d.product_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.product_image} alt="" className="w-9 h-9 object-cover rounded-md border border-border shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-md border border-border bg-background flex items-center justify-center text-muted text-xs shrink-0">—</div>
          )}
          <div>
            <p className="font-medium text-body">
              {isBn ? d.product_name_bn : d.product_name_en}
            </p>
            <p className="text-xs text-muted font-mono">{d.product_sku}</p>
          </div>
        </div>
      ),
      exportValue: d => (isBn ? d.product_name_bn : d.product_name_en),
    },
    {
      header: isBn ? "ছাড়" : "Discount",
      accessor: d => (
        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
          {d.discount_type === "PERCENTAGE"
            ? `${formatNumber(d.discount_value, locale)}% ${isBn ? "ছাড়" : "OFF"}`
            : `${formatAmount(d.discount_value, locale, 0)} ${isBn ? "ছাড়" : "OFF"}`}
        </span>
      ),
      exportValue: d =>
        `${d.discount_value}${d.discount_type === "PERCENTAGE" ? "%" : "৳"}`,
    },
    {
      header: isBn ? "নোট" : "Note",
      accessor: d =>
        d.note ? (
          <span className="text-sm text-muted">{d.note}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
      exportValue: d => d.note,
    },
    {
      header: isBn ? "মেয়াদ" : "Validity",
      accessor: d => {
        if (!d.start_date && !d.end_date) return <span className="text-muted text-xs">—</span>;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const parseLocal = (s: string) => { const [y, m, day] = s.split('-').map(Number); return new Date(y, m - 1, day); };
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
      },
      exportValue: d => [d.start_date, d.end_date].filter(Boolean).join(" → "),
    },
    {
      header: isBn ? "তারিখ" : "Created",
      accessor: d => (
        <span className="text-xs text-muted">{formatDate(d.created_at, locale)}</span>
      ),
      exportValue: d => new Date(d.created_at).toLocaleDateString(),
    },
    {
      header: isBn ? "স্ট্যাটাস" : "Status",
      accessor: d => (
        <ToggleSwitch
          checked={d.is_active}
          onChange={() => handleToggle(d.id)}
          activeLabel={isBn ? "সক্রিয়" : "Active"}
          inactiveLabel={isBn ? "নিষ্ক্রিয়" : "Inactive"}
        />
      ),
      className: "px-4 py-3 w-36",
    },
  ];

  const quickActions: QuickAction<Discount>[] = [
    {
      label: isBn ? "সম্পাদনা" : "Edit",
      icon: <Pencil className="w-3.5 h-3.5" />,
      onClick: d => setEditTarget(d),
    },
    {
      label: isBn ? "মুছুন" : "Delete",
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: d => handleDelete(d.id),
      className:
        "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors",
    },
  ];

  return (
    <>
      <ReusableTable
        data={discounts}
        columns={columns}
        keyExtractor={d => d.id}
        isLoading={isLoading || isFetching}
        quickActions={quickActions}
        enableSelection
        onBulkDelete={handleBulkDelete}
        emptyMessage={isBn ? "কোনো ডিসকাউন্ট নেই" : "No discounts yet"}
        exportFilename="discounts"
        totalPages={data?.pagination?.total_pages ?? 1}
        totalRecords={data?.pagination?.total}
        currentPage={page}
        onPageChange={p => setPage(p)}
        limit={limit}
        onLimitChange={l => { setLimit(l); setPage(1); }}
      />

      {editTarget && (
        <EditModal
          discount={editTarget}
          isBn={isBn}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}

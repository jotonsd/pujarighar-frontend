"use client";

import {
  CashbackTier,
  useListCashbackTiersQuery,
  useCreateCashbackTierMutation,
  useUpdateCashbackTierMutation,
  useDeleteCashbackTierMutation,
} from "@/api/cashback/cashbackApi";
import { FloatingInput, FloatingSelect } from "@/components/ui/forms";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import PageHeader from "@/components/ui/PageHeader";
import { ReusableTable, Column, QuickAction } from "@/components/ui/ReusableTable";
import { toast } from "@/store/toastStore";
import { formatAmount, formatNumber } from "@/utils/format";
import { useLocale } from "next-intl";
import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";

const EMPTY_FORM = {
  min_order_amount: "",
  cashback_type: "FIXED" as "FIXED" | "PERCENTAGE",
  cashback_value: "",
  max_cashback: "0",
  is_active: true,
};

function TierModal({
  open,
  editId,
  form,
  set,
  onSave,
  onClose,
  saving,
  isBn,
  locale,
}: {
  open: boolean;
  editId: number | null;
  form: typeof EMPTY_FORM;
  set: (key: keyof typeof EMPTY_FORM, val: string | boolean) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  isBn: boolean;
  locale: string;
}) {
  if (!open) return null;

  const previewCashback = () => {
    const amt = Number(form.min_order_amount) || 0;
    if (!amt || !form.cashback_value) return null;
    let cb =
      form.cashback_type === "FIXED"
        ? Number(form.cashback_value)
        : (amt * Number(form.cashback_value)) / 100;
    const max = Number(form.max_cashback);
    if (max > 0) cb = Math.min(cb, max);
    return cb;
  };

  const preview = previewCashback();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {editId !== null
              ? isBn ? "টায়ার সম্পাদনা করুন" : "Edit Cashback Tier"
              : isBn ? "নতুন টায়ার যোগ করুন" : "Add New Cashback Tier"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FloatingInput
              label={isBn ? "সর্বনিম্ন অর্ডার (৳) *" : "Min Order Amount (৳) *"}
              type="number"
              min="0"
              value={form.min_order_amount}
              onChange={(e) => set("min_order_amount", e.target.value)}
            />
            <FloatingSelect
              label={isBn ? "ক্যাশব্যাক ধরন *" : "Cashback Type *"}
              value={form.cashback_type}
              onChange={(v) => set("cashback_type", v)}
            >
              <option value="FIXED">{isBn ? "নির্দিষ্ট পরিমাণ (৳)" : "Fixed Amount (৳)"}</option>
              <option value="PERCENTAGE">{isBn ? "শতাংশ (%)" : "Percentage (%)"}</option>
            </FloatingSelect>
            <FloatingInput
              label={
                form.cashback_type === "FIXED"
                  ? isBn ? "ক্যাশব্যাক পরিমাণ (৳) *" : "Cashback Amount (৳) *"
                  : isBn ? "শতাংশ (%) *" : "Percentage (%) *"
              }
              type="number"
              min="0"
              step={form.cashback_type === "PERCENTAGE" ? "0.01" : "1"}
              value={form.cashback_value}
              onChange={(e) => set("cashback_value", e.target.value)}
            />
            <FloatingInput
              label={isBn ? "সর্বোচ্চ ক্যাশব্যাক (৳) — 0 = সীমা নেই" : "Max Cashback (৳) — 0 = no limit"}
              type="number"
              min="0"
              value={form.max_cashback}
              onChange={(e) => set("max_cashback", e.target.value)}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {isBn ? "সক্রিয়" : "Active"}
            </span>
            <ToggleSwitch
              checked={form.is_active}
              onChange={() => set("is_active", !form.is_active)}
              activeLabel={isBn ? "চালু" : "On"}
              inactiveLabel={isBn ? "বন্ধ" : "Off"}
            />
          </div>

          {/* Live preview */}
          {preview !== null && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <span className="font-semibold">
                {isBn ? "পূর্বরূপ: " : "Preview: "}
              </span>
              {isBn
                ? `${formatAmount(form.min_order_amount, locale, 0)} অর্ডারে ক্যাশব্যাক → ${formatAmount(preview, locale)}`
                : `${formatAmount(form.min_order_amount, locale, 0)} order → ${formatAmount(preview, locale)} cashback`}
              {Number(form.max_cashback) > 0 && (
                <span className="text-amber-600 ml-2 text-xs">
                  ({isBn
                    ? `সর্বোচ্চ ${formatAmount(form.max_cashback, locale, 0)}`
                    : `max ${formatAmount(form.max_cashback, locale, 0)}`})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onSave} disabled={saving} className="btn-primary flex-1">
            {saving
              ? isBn ? "সংরক্ষণ হচ্ছে..." : "Saving..."
              : isBn ? "সংরক্ষণ করুন" : "Save Tier"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            {isBn ? "বাতিল" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CashbackSettingPage() {
  const locale = useLocale();
  const isBn   = locale === "bn";

  const { data: tiers = [], isLoading } = useListCashbackTiersQuery();
  const [create, { isLoading: creating }] = useCreateCashbackTierMutation();
  const [update]                          = useUpdateCashbackTierMutation();
  const [remove]                          = useDeleteCashbackTierMutation();

  const [form, setForm]     = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const set = (key: keyof typeof EMPTY_FORM, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (tier: CashbackTier) => {
    setForm({
      min_order_amount: tier.min_order_amount,
      cashback_type:    tier.cashback_type,
      cashback_value:   tier.cashback_value,
      max_cashback:     tier.max_cashback,
      is_active:        tier.is_active,
    });
    setEditId(tier.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
  };

  const handleSave = async () => {
    if (!form.min_order_amount || !form.cashback_value) {
      toast.error(isBn ? "সব তথ্য পূরণ করুন" : "Fill all required fields");
      return;
    }
    try {
      if (editId !== null) {
        await update({ id: editId, ...form }).unwrap();
        toast.success(isBn ? "আপডেট হয়েছে" : "Tier updated");
      } else {
        await create(form).unwrap();
        toast.success(isBn ? "নতুন টায়ার যোগ হয়েছে" : "Tier added");
      }
      closeModal();
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await remove(id).unwrap();
      toast.success(isBn ? "মুছে ফেলা হয়েছে" : "Tier deleted");
    } catch {
      toast.error(isBn ? "মুছতে ব্যর্থ" : "Delete failed");
    }
  };

  const handleToggle = async (tier: CashbackTier) => {
    try {
      await update({ id: tier.id, is_active: !tier.is_active }).unwrap();
    } catch {
      toast.error(isBn ? "আপডেট ব্যর্থ" : "Update failed");
    }
  };

  const columns: Column<CashbackTier>[] = [
    {
      header: isBn ? "সর্বনিম্ন অর্ডার" : "Min Order",
      accessor: (t) => (
        <span className="font-bold text-gray-800">
          {formatAmount(t.min_order_amount, locale, 0)}
        </span>
      ),
    },
    {
      header: isBn ? "ধরন" : "Type",
      accessor: (t) =>
        t.cashback_type === "FIXED"
          ? <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{isBn ? "নির্দিষ্ট" : "Fixed"}</span>
          : <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">{isBn ? "শতাংশ" : "Percent"}</span>,
    },
    {
      header: isBn ? "ক্যাশব্যাক পরিমাণ" : "Cashback Value",
      accessor: (t) => (
        <span className="font-bold text-green-700">
          {t.cashback_type === "FIXED"
            ? formatAmount(t.cashback_value, locale, 0)
            : `${formatNumber(t.cashback_value, locale)}%`}
        </span>
      ),
    },
    {
      header: isBn ? "সর্বোচ্চ সীমা" : "Max Cap",
      accessor: (t) =>
        Number(t.max_cashback) > 0
          ? <span className="font-bold text-gray-700">{formatAmount(t.max_cashback, locale, 0)}</span>
          : <span className="text-gray-400 text-xs">—</span>,
    },
    {
      header: isBn ? "সক্রিয়" : "Active",
      accessor: (t) => (
        <ToggleSwitch
          checked={t.is_active}
          onChange={() => handleToggle(t)}
          activeLabel={isBn ? "চালু" : "On"}
          inactiveLabel={isBn ? "বন্ধ" : "Off"}
        />
      ),
    },
  ];

  const quickActions: QuickAction<CashbackTier>[] = [
    {
      label: isBn ? "সম্পাদনা" : "Edit",
      icon: <Pencil className="w-3.5 h-3.5" />,
      onClick: openEdit,
    },
    {
      label: isBn ? "মুছুন" : "Delete",
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (t) => handleDelete(t.id),
      className:
        "inline-flex items-center justify-center w-8 h-8 text-red-500 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-xs",
    },
  ];

  return (
    <div className="max-w-7xl">
      <PageHeader
        title={isBn ? "ক্যাশব্যাক টায়ার" : "Cashback Tiers"}
        description={
          isBn
            ? "অর্ডার পরিমাণ অনুযায়ী একাধিক ক্যাশব্যাক টায়ার নির্ধারণ করুন"
            : "Configure multiple cashback tiers based on order amount"
        }
        showBack
        actions={
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            {isBn ? "নতুন টায়ার" : "Add Tier"}
          </button>
        }
      />

      <ReusableTable<CashbackTier>
        data={tiers}
        columns={columns}
        keyExtractor={(t) => t.id}
        isLoading={isLoading}
        quickActions={quickActions}
        emptyMessage={isBn ? "কোনো ক্যাশব্যাক টায়ার নেই" : "No cashback tiers yet"}
        exportFilename="cashback-tiers"
      />

      <TierModal
        open={modalOpen}
        editId={editId}
        form={form}
        set={set}
        onSave={handleSave}
        onClose={closeModal}
        saving={creating}
        isBn={isBn}
        locale={locale}
      />
    </div>
  );
}

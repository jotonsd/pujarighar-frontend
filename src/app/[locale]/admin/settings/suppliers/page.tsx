"use client";

import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useGetSupplierPaymentsQuery,
  useCreateSupplierPaymentMutation,
  useDeleteSupplierPaymentMutation,
} from "@/api/suppliers/suppliersApi";
import { FloatingInput, FloatingTextarea, FloatingDatePicker } from "@/components/ui/forms";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import PageHeader from "@/components/ui/PageHeader";
import { ReusableTable, Column, QuickAction } from "@/components/ui/ReusableTable";
import { Supplier, SupplierPayment } from "@/lib/types";
import { formatAmount } from "@/utils/format";
import { toast } from "@/store/toastStore";
import { Pencil, X, Wallet, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";

const EMPTY: Partial<Supplier> = { name_bn: "", name_en: "", phone: "", address: "" };
const TODAY = new Date().toISOString().slice(0, 10);

// ── Payment Modal ─────────────────────────────────────────────────────────────

function PaymentModal({
  supplier,
  isBn,
  locale,
  onClose,
}: {
  supplier: Supplier;
  isBn: boolean;
  locale: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useGetSupplierPaymentsQuery(supplier.id);
  const [createPayment, { isLoading: saving }] = useCreateSupplierPaymentMutation();
  const [deletePayment] = useDeleteSupplierPaymentMutation();

  const [form, setForm] = useState({ amount: "", paid_date: TODAY, note: "" });
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  // Use fresh supplier data from the payments query — stale prop has pre-payment totals
  const fresh   = data?.supplier ?? supplier;
  const balance = parseFloat(fresh.total_balance || "0");
  const paid    = data ? data.payments.reduce((s, p) => s + parseFloat(p.amount), 0) : 0;

  const handleAdd = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error(isBn ? "পরিমাণ আবশ্যক" : "Amount required");
      return;
    }
    if (!form.paid_date) {
      toast.error(isBn ? "তারিখ আবশ্যক" : "Date required");
      return;
    }
    try {
      await createPayment({ supplierId: supplier.id, ...form }).unwrap();
      toast.success(isBn ? "পেমেন্ট যোগ হয়েছে" : "Payment recorded");
      setForm({ amount: "", paid_date: TODAY, note: "" });
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed");
    }
  };

  const handleDelete = async (payment: SupplierPayment) => {
    if (!confirm(isBn ? "এই পেমেন্ট মুছবেন?" : "Delete this payment?")) return;
    try {
      await deletePayment({ supplierId: supplier.id, paymentId: payment.id }).unwrap();
      toast.success(isBn ? "মুছে গেছে" : "Deleted");
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">{supplier.name_bn}</h2>
            <p className="text-xs text-gray-400">{isBn ? "সরবরাহকারী পেমেন্ট" : "Supplier Payments"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary cards — use fresh data from payments query */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-gray-100">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-xs text-blue-500 font-medium">{isBn ? "মোট ক্রেডিট ক্রয়" : "Total Credit"}</p>
            <p className="text-base font-bold text-blue-700">{formatAmount(fresh.total_credit, locale, 0)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xs text-green-500 font-medium">{isBn ? "মোট পরিশোধ" : "Total Paid"}</p>
            <p className="text-base font-bold text-green-700">{formatAmount(fresh.total_paid, locale, 0)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${balance > 0 ? "bg-red-50" : "bg-gray-50"}`}>
            <p className={`text-xs font-medium ${balance > 0 ? "text-red-500" : "text-gray-400"}`}>
              {isBn ? "বাকি" : "Balance Due"}
            </p>
            <p className={`text-base font-bold ${balance > 0 ? "text-red-700" : "text-gray-500"}`}>
              {formatAmount(fresh.total_balance, locale, 0)}
            </p>
          </div>
        </div>

        {/* Add payment form */}
        <div className="px-6 py-4 border-b border-gray-100 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {isBn ? "নতুন পেমেন্ট" : "New Payment"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FloatingInput
              label={isBn ? "পরিমাণ (৳) *" : "Amount (৳) *"}
              type="number"
              value={form.amount}
              onChange={f("amount")}
            />
            <FloatingDatePicker
              label={isBn ? "তারিখ *" : "Date *"}
              value={form.paid_date}
              onChange={v => setForm(p => ({ ...p, paid_date: v ?? TODAY }))}
            />
          </div>
          <FloatingInput
            label={isBn ? "নোট" : "Note"}
            value={form.note}
            onChange={f("note")}
          />
          <div className="flex gap-3">
            <button onClick={handleAdd} disabled={saving} className="flex-1 btn-primary">
              {saving ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "পেমেন্ট যোগ করুন" : "Add Payment")}
            </button>
            <button onClick={onClose} className="flex-1 btn-secondary">
              {isBn ? "বন্ধ করুন" : "Close"}
            </button>
          </div>
        </div>

        {/* Payment history — below form, scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {isBn ? "পেমেন্ট ইতিহাস" : "Payment History"}
          </p>
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-6">{isBn ? "লোড হচ্ছে..." : "Loading..."}</p>
          ) : !data?.payments.length ? (
            <p className="text-sm text-gray-400 text-center py-6">{isBn ? "কোনো পেমেন্ট নেই" : "No payments yet"}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2">{isBn ? "তারিখ" : "Date"}</th>
                  <th className="text-right pb-2">{isBn ? "পরিমাণ" : "Amount"}</th>
                  <th className="text-left pb-2 pl-4">{isBn ? "নোট" : "Note"}</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {data.payments.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 text-gray-600">{p.paid_date}</td>
                    <td className="py-2.5 text-right font-semibold text-green-700">
                      {formatAmount(p.amount, locale, 0)}
                    </td>
                    <td className="py-2.5 pl-4 text-gray-500 text-xs">{p.note || "—"}</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleDelete(p)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="text-xs font-semibold text-gray-600 border-t border-gray-200">
                  <td className="pt-2">{isBn ? "মোট" : "Total"}</td>
                  <td className="pt-2 text-right text-green-700">{formatAmount(paid, locale, 0)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const locale = useLocale();
  const isBn = locale === "bn";

  const { data: suppliers = [], isLoading } = useGetSuppliersQuery({ includeInactive: true });
  const [createSupplier, { isLoading: creating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: updating }] = useUpdateSupplierMutation();

  const [showForm, setShowForm]         = useState(false);
  const [editing, setEditing]           = useState<Supplier | null>(null);
  const [form, setForm]                 = useState<Partial<Supplier>>(EMPTY);
  const [paymentFor, setPaymentFor]     = useState<Supplier | null>(null);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit   = (s: Supplier) => {
    setEditing(s);
    setForm({ name_bn: s.name_bn, name_en: s.name_en, phone: s.phone, address: s.address });
    setShowForm(true);
  };
  const close = () => { setShowForm(false); setEditing(null); setForm(EMPTY); };

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name_bn) { toast.error(isBn ? "নাম (বাংলা) আবশ্যক" : "Bangla name required"); return; }
    try {
      if (editing) {
        await updateSupplier({ id: editing.id, ...form }).unwrap();
        toast.success(isBn ? "আপডেট হয়েছে" : "Updated");
      } else {
        await createSupplier(form).unwrap();
        toast.success(isBn ? "সরবরাহকারী তৈরি হয়েছে" : "Supplier created");
      }
      close();
    } catch { toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed"); }
  };

  const toggleActive = async (s: Supplier) => {
    try {
      await updateSupplier({ id: s.id, is_active: !s.is_active }).unwrap();
    } catch { toast.error(isBn ? "ব্যর্থ" : "Failed"); }
  };

  // Summary totals
  const totalCredit  = suppliers.reduce((s, x) => s + parseFloat(x.total_credit  || "0"), 0);
  const totalPaid    = suppliers.reduce((s, x) => s + parseFloat(x.total_paid    || "0"), 0);
  const totalBalance = suppliers.reduce((s, x) => s + parseFloat(x.total_balance || "0"), 0);

  const columns: Column<Supplier>[] = [
    {
      header: isBn ? "নাম" : "Name",
      accessor: (s) => (
        <div>
          <p className="font-semibold text-gray-800">{s.name_bn}</p>
          {s.name_en && <p className="text-xs text-gray-400">{s.name_en}</p>}
        </div>
      ),
    },
    {
      header: isBn ? "ফোন" : "Phone",
      accessor: (s) => s.phone
        ? <span className="text-gray-700">{s.phone}</span>
        : <span className="text-gray-300">—</span>,
    },
    {
      header: isBn ? "মোট ক্রেডিট" : "Total Credit",
      accessor: (s) => (
        <span className="font-semibold text-blue-700">{formatAmount(s.total_credit, locale, 0)}</span>
      ),
    },
    {
      header: isBn ? "পরিশোধ" : "Paid",
      accessor: (s) => (
        <span className="font-semibold text-green-700">{formatAmount(s.total_paid, locale, 0)}</span>
      ),
    },
    {
      header: isBn ? "বাকি" : "Balance Due",
      accessor: (s) => {
        const bal = parseFloat(s.total_balance || "0");
        return (
          <span className={`font-bold ${bal > 0 ? "text-red-600" : "text-gray-400"}`}>
            {formatAmount(s.total_balance, locale, 0)}
          </span>
        );
      },
    },
    {
      header: isBn ? "স্ট্যাটাস" : "Status",
      accessor: (s) => (
        <ToggleSwitch
          checked={s.is_active}
          onChange={() => toggleActive(s)}
          activeLabel={isBn ? "সক্রিয়" : "Active"}
          inactiveLabel={isBn ? "নিষ্ক্রিয়" : "Inactive"}
        />
      ),
    },
  ];

  const quickActions: QuickAction<Supplier>[] = [
    {
      label: isBn ? "পেমেন্ট" : "Payment",
      icon: <Wallet className="w-3.5 h-3.5" />,
      onClick: (s) => setPaymentFor(s),
      className: "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-green-200 bg-green-50 text-green-600 hover:bg-green-100 transition-colors",
    },
    {
      label: isBn ? "সম্পাদনা" : "Edit",
      icon: <Pencil className="w-3.5 h-3.5" />,
      onClick: openEdit,
      className: "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors",
    },
  ];

  return (
    <div className="max-w-7xl">
      <PageHeader
        title={isBn ? "সরবরাহকারী" : "Suppliers"}
        addLabel={isBn ? "+ যোগ করুন" : "+ Add"}
        onAdd={openCreate}
      />

      {/* Summary cards */}
      {suppliers.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs text-blue-500 font-medium">{isBn ? "মোট ক্রেডিট ক্রয়" : "Total Credit Purchases"}</p>
            <p className="text-xl font-bold text-blue-700 mt-1">{formatAmount(totalCredit, locale, 0)}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs text-green-500 font-medium">{isBn ? "মোট পরিশোধ" : "Total Paid"}</p>
            <p className="text-xl font-bold text-green-700 mt-1">{formatAmount(totalPaid, locale, 0)}</p>
          </div>
          <div className={`border rounded-xl p-4 ${totalBalance > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
            <p className={`text-xs font-medium ${totalBalance > 0 ? "text-red-500" : "text-gray-400"}`}>
              {isBn ? "মোট বাকি" : "Outstanding Balance"}
            </p>
            <p className={`text-xl font-bold mt-1 ${totalBalance > 0 ? "text-red-700" : "text-gray-400"}`}>
              {formatAmount(totalBalance, locale, 0)}
            </p>
          </div>
        </div>
      )}

      <ReusableTable<Supplier>
        data={suppliers}
        columns={columns}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        quickActions={quickActions}
        emptyMessage={isBn ? "কোনো সরবরাহকারী নেই" : "No suppliers yet"}
        skeletonRows={6}
        exportFilename="suppliers"
      />

      {/* Supplier create/edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800">
                {editing ? (isBn ? "সম্পাদনা করুন" : "Edit Supplier") : (isBn ? "নতুন সরবরাহকারী" : "New Supplier")}
              </h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <FloatingInput label={isBn ? "নাম (বাংলা) *" : "Name (Bangla) *"} value={form.name_bn ?? ""} onChange={f("name_bn")} />
            <FloatingInput label={isBn ? "নাম (ইংরেজি)" : "Name (English)"} value={form.name_en ?? ""} onChange={f("name_en")} />
            <FloatingInput label={isBn ? "ফোন" : "Phone"} value={form.phone ?? ""} onChange={f("phone")} />
            <FloatingTextarea label={isBn ? "ঠিকানা" : "Address"} value={form.address ?? ""} onChange={f("address")} rows={2} />
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={creating || updating} className="flex-1 btn-primary">
                {creating || updating ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save")}
              </button>
              <button onClick={close} className="flex-1 btn-secondary">{isBn ? "বাতিল" : "Cancel"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {paymentFor && (
        <PaymentModal
          supplier={paymentFor}
          isBn={isBn}
          locale={locale}
          onClose={() => setPaymentFor(null)}
        />
      )}
    </div>
  );
}

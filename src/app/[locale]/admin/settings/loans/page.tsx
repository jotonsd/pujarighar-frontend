"use client";

import {
  useGetLoanInvestorsQuery,
  useCreateLoanInvestorMutation,
  useUpdateLoanInvestorMutation,
  useDeleteLoanInvestorMutation,
  useGetLoanPaymentsQuery,
  useCreateLoanPaymentMutation,
  useDeleteLoanPaymentMutation,
} from "@/api/loans/loansApi";
import { FloatingInput, FloatingSelect, FloatingDatePicker } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import { ReusableTable, Column, QuickAction } from "@/components/ui/ReusableTable";
import { LoanInvestor, LoanPayment } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { formatAmount, formatNumber } from "@/utils/format";
import { Loader2, Pencil, Trash2, X, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";

const NOW       = new Date();
const TODAY_STR = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, "0")}-${String(NOW.getDate()).padStart(2, "0")}`;

const EMPTY_LOAN: Partial<LoanInvestor> = {
  name_bn: "", name_en: "", phone: "",
  principal: "", interest_rate: "", loan_date: TODAY_STR, due_date: "", note: "",
};

// ─── Loan Payments Modal ────────────────────────────────────────────────────────
function LoanPaymentsModal({
  loan,
  onClose,
  isBn,
}: {
  loan: LoanInvestor;
  onClose: () => void;
  isBn: boolean;
}) {
  const locale = useLocale();
  const { data, isLoading } = useGetLoanPaymentsQuery(loan.id);
  const [createPayment, { isLoading: creating }] = useCreateLoanPaymentMutation();
  const [deletePayment] = useDeleteLoanPaymentMutation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    payment_type: "INTEREST" as "INTEREST" | "PRINCIPAL",
    amount: "",
    paid_date: TODAY_STR,
    note: "",
  });

  const fresh = data?.loan ?? loan;
  const remaining = parseFloat(fresh.remaining_principal ?? loan.remaining_principal);

  const paymentTypeOptions = [
    { value: "INTEREST",  label: isBn ? "সুদ পরিশোধ"  : "Interest Payment" },
    { value: "PRINCIPAL", label: isBn ? "আসল পরিশোধ" : "Principal Repayment" },
  ];

  const handleSave = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error(isBn ? "পরিমাণ প্রয়োজন" : "Amount required");
      return;
    }
    try {
      await createPayment({ loanId: loan.id, ...form }).unwrap();
      toast.success(isBn ? "পেমেন্ট রেকর্ড হয়েছে" : "Payment recorded");
      setShowForm(false);
      setForm({ payment_type: "INTEREST", amount: "", paid_date: TODAY_STR, note: "" });
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || (isBn ? "ব্যর্থ" : "Failed");
      toast.error(msg);
    }
  };

  const handleDelete = async (p: LoanPayment) => {
    try {
      await deletePayment({ loanId: loan.id, paymentId: p.id }).unwrap();
      toast.success(isBn ? "মুছে ফেলা হয়েছে" : "Deleted");
    } catch { toast.error(isBn ? "ব্যর্থ" : "Failed"); }
  };

  const paymentColumns: Column<LoanPayment>[] = [
    {
      header: isBn ? "ধরন" : "Type",
      accessor: (p) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold
          ${p.payment_type === "INTEREST"
            ? "bg-orange-50 text-orange-600 border border-orange-100"
            : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
          {p.payment_type === "INTEREST"
            ? (isBn ? "সুদ" : "Interest")
            : (isBn ? "আসল" : "Principal")}
        </span>
      ),
    },
    {
      header: isBn ? "পরিমাণ" : "Amount",
      accessor: (p) => <span className="font-semibold text-gray-800">{formatAmount(p.amount, locale)}</span>,
      headerClassName: "px-4 py-3 text-right text-xs font-bold text-blue-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-right",
    },
    {
      header: isBn ? "তারিখ" : "Date",
      accessor: (p) => <span className="text-xs text-gray-500">{p.paid_date}</span>,
      headerClassName: "px-4 py-3 text-right text-xs font-bold text-blue-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-right",
    },
    {
      header: isBn ? "নোট" : "Note",
      accessor: (p) => <span className="text-xs text-gray-400">{p.note || "—"}</span>,
    },
  ];

  const paymentActions: QuickAction<LoanPayment>[] = [
    {
      label: "Delete",
      icon: <Trash2 className="w-3 h-3" />,
      onClick: handleDelete,
      className: "inline-flex items-center justify-center w-7 h-7 rounded-lg border border-red-100 bg-red-50 text-red-400 hover:bg-red-100 transition-colors",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 className="font-bold text-gray-800">{loan.name_bn}</h2>
            <p className="text-xs text-gray-400">
              {loan.name_en && `${loan.name_en} · `}
              {isBn ? "মূল ঋণ" : "Principal"}: {formatAmount(loan.principal, locale)} @ {formatNumber(loan.interest_rate, locale)}% {isBn ? "সুদ" : "interest"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                {isBn ? "+ পেমেন্ট" : "+ Payment"}
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary */}
        {data && (
          <div className="grid grid-cols-3 gap-3 px-6 py-4 bg-gray-50 border-b shrink-0">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-0.5">{isBn ? "মোট সুদ পরিশোধ" : "Interest Paid"}</p>
              <p className="font-bold text-orange-600">{formatAmount(data.total_interest, locale)}</p>
            </div>
            <div className="text-center border-x">
              <p className="text-xs text-gray-500 mb-0.5">{isBn ? "আসল পরিশোধ" : "Principal Paid"}</p>
              <p className="font-bold text-blue-600">{formatAmount(data.total_principal, locale)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-0.5">{isBn ? "বাকি আসল" : "Remaining"}</p>
              <p className={`font-bold ${remaining > 0 ? "text-red-600" : "text-green-600"}`}>
                {formatAmount(String(remaining.toFixed(2)), locale)}
              </p>
            </div>
          </div>
        )}

        {/* ℹ️ Investor type note */}
        <div className="mx-6 mt-4 mb-1 shrink-0 flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
          <span className="text-base">ℹ️</span>
          <span>
            {isBn
              ? "ঋণ বিনিয়োগকারী লাভ ভাগ পান না — তারা কেবল সুদ ও মূল ঋণ ফেরত পান।"
              : "Loan investors do NOT receive profit share — they receive interest payments and principal repayment only."}
          </span>
        </div>

        {/* Payment form */}
        {showForm && (
          <div className="px-6 py-5 bg-blue-50 border-b shrink-0 mt-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {isBn ? "পেমেন্ট রেকর্ড করুন" : "Record Payment"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <FloatingSelect
                label={isBn ? "পেমেন্টের ধরন" : "Payment Type"}
                value={form.payment_type}
                onChange={(v) => setForm((p) => ({ ...p, payment_type: v as "INTEREST" | "PRINCIPAL" }))}
                options={paymentTypeOptions}
                searchable={false}
                showClearButton={false}
              />
              <div className="relative">
                <FloatingInput
                  label={isBn ? "পরিমাণ (৳)" : "Amount (৳)"}
                  type="number" min="0" step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                />
                {form.payment_type === "PRINCIPAL" && remaining > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, amount: String(remaining.toFixed(2)) }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    {isBn ? "পূর্ণ" : "Full"}
                  </button>
                )}
              </div>
              <FloatingDatePicker
                label={isBn ? "তারিখ" : "Date"}
                value={form.paid_date}
                onChange={(v) => setForm((p) => ({ ...p, paid_date: v }))}
                clearable
              />
              <FloatingInput
                label={isBn ? "নোট (ঐচ্ছিক)" : "Note (optional)"}
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} disabled={creating} className="btn-primary">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : (isBn ? "সংরক্ষণ করুন" : "Save")}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">
                {isBn ? "বাতিল" : "Cancel"}
              </button>
            </div>
          </div>
        )}

        {/* Payment history */}
        <div className="overflow-auto flex-1 px-6 py-4">
          <ReusableTable<LoanPayment>
            data={data?.payments ?? []}
            columns={paymentColumns}
            keyExtractor={(p) => p.id}
            isLoading={isLoading}
            quickActions={paymentActions}
            emptyMessage={isBn ? "কোনো পেমেন্ট নেই" : "No payments yet"}
            skeletonRows={3}
            exportFilename={`loan-payments-${loan.name_en || loan.name_bn}`}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────────
export default function LoansPage() {
  const locale = useLocale();
  const isBn   = locale === "bn";

  const { data: loans = [], isLoading } = useGetLoanInvestorsQuery();
  const [createLoan, { isLoading: creating }] = useCreateLoanInvestorMutation();
  const [updateLoan, { isLoading: updating }] = useUpdateLoanInvestorMutation();
  const [deleteLoan] = useDeleteLoanInvestorMutation();

  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<LoanInvestor | null>(null);
  const [form, setForm]           = useState<Partial<LoanInvestor>>(EMPTY_LOAN);
  const [detailLoan, setDetailLoan] = useState<LoanInvestor | null>(null);

  const totalPrincipal  = loans.reduce((s, l) => s + parseFloat(l.principal || "0"), 0);
  const totalRemaining  = loans.reduce((s, l) => s + parseFloat(l.remaining_principal || "0"), 0);
  const totalInterest   = loans.reduce((s, l) => s + parseFloat(l.total_interest_paid || "0"), 0);

  const openCreate = () => { setEditing(null); setForm(EMPTY_LOAN); setShowForm(true); };
  const openEdit   = (l: LoanInvestor) => {
    setEditing(l);
    setForm({
      name_bn: l.name_bn, name_en: l.name_en, phone: l.phone,
      principal: l.principal, interest_rate: l.interest_rate,
      loan_date: l.loan_date, due_date: l.due_date ?? "", note: l.note,
    });
    setShowForm(true);
  };
  const close = () => { setShowForm(false); setEditing(null); setForm(EMPTY_LOAN); };

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name_bn) { toast.error(isBn ? "নাম আবশ্যক" : "Name required"); return; }
    if (!form.principal || parseFloat(form.principal) <= 0) { toast.error(isBn ? "মূল ঋণ আবশ্যক" : "Principal required"); return; }
    try {
      const payload = { ...form, due_date: form.due_date || null };
      if (editing) {
        await updateLoan({ id: editing.id, ...payload }).unwrap();
        toast.success(isBn ? "আপডেট হয়েছে" : "Updated");
      } else {
        await createLoan(payload).unwrap();
        toast.success(isBn ? "ঋণ বিনিয়োগকারী তৈরি হয়েছে — জার্নাল পোস্ট হয়েছে" : "Loan investor created — journal posted");
      }
      close();
    } catch { toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed"); }
  };

  const handleDelete = async (l: LoanInvestor) => {
    try {
      await deleteLoan(l.id).unwrap();
      toast.success(isBn ? "নিষ্ক্রিয় করা হয়েছে" : "Deactivated");
    } catch { toast.error(isBn ? "ব্যর্থ" : "Failed"); }
  };

  const columns: Column<LoanInvestor>[] = [
    {
      header: isBn ? "নাম" : "Name",
      accessor: (l) => {
        const primary   = isBn ? (l.name_bn || l.name_en) : (l.name_en || l.name_bn)
        const secondary = isBn ? (l.name_bn !== l.name_en ? l.name_en : "") : (l.name_en !== l.name_bn ? l.name_bn : "")
        return (
          <div>
            <p className="font-semibold text-gray-800">{primary}</p>
            {secondary && <p className="text-xs text-gray-400">{secondary}</p>}
            {l.phone && <p className="text-xs text-gray-400">{l.phone}</p>}
          </div>
        )
      },
    },
    {
      header: isBn ? "মূল ঋণ" : "Principal",
      accessor: (l) => <span className="font-semibold text-gray-700">{formatAmount(l.principal, locale)}</span>,
      headerClassName: "px-4 py-3 text-right text-xs font-bold text-blue-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-right",
    },
    {
      header: isBn ? "সুদ %" : "Interest %",
      accessor: (l) => (
        <span className="inline-block px-2 py-1 rounded-full text-xs font-bold text-orange-700 bg-orange-50 border border-orange-100">
          {formatNumber(l.interest_rate, locale)}% {isBn ? "বার্ষিক" : "p.a."}
        </span>
      ),
      headerClassName: "px-4 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-center",
    },
    {
      header: isBn ? "সুদ পরিশোধ" : "Interest Paid",
      accessor: (l) => <span className="text-orange-600">{formatAmount(l.total_interest_paid || "0", locale)}</span>,
      headerClassName: "px-4 py-3 text-right text-xs font-bold text-blue-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-right",
    },
    {
      header: isBn ? "বাকি আসল" : "Remaining",
      accessor: (l) => (
        <span className={`font-bold ${parseFloat(l.remaining_principal || "0") > 0 ? "text-red-500" : "text-green-600"}`}>
          {formatAmount(l.remaining_principal || "0", locale)}
        </span>
      ),
      headerClassName: "px-4 py-3 text-right text-xs font-bold text-blue-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-right",
    },
    {
      header: isBn ? "মেয়াদ" : "Due Date",
      accessor: (l) => <span className="text-xs text-gray-400">{l.due_date ?? "—"}</span>,
      headerClassName: "px-4 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-center",
    },
    {
      header: isBn ? "বিস্তারিত" : "Details",
      accessor: (l) => (
        <div className="flex justify-center">
          <button
            onClick={() => setDetailLoan(l)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
          >
            {isBn ? "দেখুন" : "View"} <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      ),
      headerClassName: "px-4 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm",
    },
  ];

  const quickActions: QuickAction<LoanInvestor>[] = [
    {
      label: isBn ? "সম্পাদনা" : "Edit",
      icon: <Pencil className="w-3.5 h-3.5" />,
      onClick: openEdit,
      className: "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors",
    },
    {
      label: isBn ? "নিষ্ক্রিয়" : "Deactivate",
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: handleDelete,
      className: "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-100 bg-red-50 text-red-400 hover:bg-red-100 transition-colors",
    },
  ];

  return (
    <div className="max-w-7xl">
      <PageHeader
        title={isBn ? "ঋণ বিনিয়োগকারী" : "Loan Investors"}
        description={isBn ? "ঋণদাতাদের সুদ ও আসল পরিশোধের হিসাব রাখুন — লাভ ভাগ নেই" : "Track interest and principal repayments to lenders — no profit share"}
        addLabel={isBn ? "+ নতুন ঋণ" : "+ New Loan"}
        onAdd={openCreate}
      />

      {/* Info banner */}
      <div className="mb-5 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
        <span className="text-base">💡</span>
        <span>
          {isBn
            ? "ঋণ বিনিয়োগকারীরা ব্যবসার লাভ-ভাগ পান না। তারা নির্দিষ্ট সুদ হারে সুদ ও মূল ঋণ ফেরত পান। (Equity অংশীদারদের জন্য 'অংশীদার' পৃষ্ঠা দেখুন।)"
            : "Loan investors do NOT receive profit share. They receive fixed interest payments and principal repayment. (For equity partners who share in profit, see the Partners page.)"}
        </span>
      </div>

      {/* Summary cards */}
      {loans.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center py-4">
            <p className="text-xs text-gray-500 mb-1">{isBn ? "মোট ঋণ" : "Total Borrowed"}</p>
            <p className="text-2xl font-bold text-blue-600">{formatAmount(String(totalPrincipal.toFixed(2)), locale)}</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-xs text-gray-500 mb-1">{isBn ? "মোট সুদ পরিশোধ" : "Total Interest Paid"}</p>
            <p className="text-2xl font-bold text-orange-500">{formatAmount(String(totalInterest.toFixed(2)), locale)}</p>
          </div>
          <div className={`card text-center py-4 ${totalRemaining > 0 ? "border-red-100 bg-red-50" : ""}`}>
            <p className="text-xs text-gray-500 mb-1">{isBn ? "বাকি মূল ঋণ" : "Outstanding Principal"}</p>
            <p className={`text-2xl font-bold ${totalRemaining > 0 ? "text-red-600" : "text-green-600"}`}>
              {formatAmount(String(totalRemaining.toFixed(2)), locale)}
            </p>
          </div>
        </div>
      )}

      <ReusableTable<LoanInvestor>
        data={loans}
        columns={columns}
        keyExtractor={(l) => l.id}
        isLoading={isLoading}
        quickActions={quickActions}
        emptyMessage={isBn ? "কোনো ঋণ বিনিয়োগকারী নেই" : "No loan investors yet"}
        skeletonRows={3}
        exportFilename="loan-investors"
      />

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">
                {editing ? (isBn ? "ঋণ সম্পাদনা" : "Edit Loan") : (isBn ? "নতুন ঋণ বিনিয়োগকারী" : "New Loan Investor")}
              </h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {!editing && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700 mb-4">
                {isBn
                  ? "নতুন ঋণ তৈরি হলে স্বয়ংক্রিয়ভাবে জার্নাল পোস্ট হবে: Dr নগদ / Cr ঋণ দায়"
                  : "Creating a loan auto-posts a journal: Dr Cash / Cr Loan Payable"}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FloatingInput label={isBn ? "নাম (বাংলা) *" : "Name (Bangla) *"} value={form.name_bn ?? ""} onChange={f("name_bn")} />
              <FloatingInput label={isBn ? "নাম (ইংরেজি)" : "Name (English)"} value={form.name_en ?? ""} onChange={f("name_en")} />
              <FloatingInput label={isBn ? "ফোন" : "Phone"} value={form.phone ?? ""} onChange={f("phone")} />
              <FloatingInput
                label={isBn ? "মূল ঋণ পরিমাণ (৳) *" : "Principal Amount (৳) *"}
                type="number" min="0" step="0.01"
                value={form.principal ?? ""}
                onChange={f("principal")}
                disabled={!!editing}
              />
              <FloatingInput
                label={isBn ? "বার্ষিক সুদের হার (%) *" : "Annual Interest Rate (%) *"}
                type="number" min="0" max="100" step="0.01"
                value={form.interest_rate ?? ""}
                onChange={f("interest_rate")}
              />
              <FloatingDatePicker
                label={isBn ? "ঋণ গ্রহণের তারিখ *" : "Loan Date *"}
                value={form.loan_date ?? ""}
                onChange={(v) => setForm((p) => ({ ...p, loan_date: v }))}
                clearable={false}
              />
              <FloatingDatePicker
                label={isBn ? "পরিশোধের সময়সীমা" : "Due Date (optional)"}
                value={form.due_date ?? ""}
                onChange={(v) => setForm((p) => ({ ...p, due_date: v }))}
                clearable
              />
              <FloatingInput
                label={isBn ? "নোট (ঐচ্ছিক)" : "Note (optional)"}
                value={form.note ?? ""}
                onChange={f("note")}
              />
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={creating || updating} className="flex-1 btn-primary">
                {creating || updating ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save")}
              </button>
              <button onClick={close} className="flex-1 btn-secondary">{isBn ? "বাতিল" : "Cancel"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment details modal */}
      {detailLoan && (
        <LoanPaymentsModal
          loan={detailLoan}
          onClose={() => setDetailLoan(null)}
          isBn={isBn}
        />
      )}
    </div>
  );
}

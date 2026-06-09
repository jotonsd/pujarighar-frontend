"use client";

import { useGetProfitLossQuery } from "@/api/accounting/accountingApi";
import {
  useGetPartnersQuery,
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
  useDeletePartnerMutation,
  useGetPartnerPaymentsQuery,
  useCreatePartnerPaymentMutation,
  useUpdatePartnerPaymentMutation,
  useDeletePartnerPaymentMutation,
} from "@/api/partners/partnersApi";
import { FloatingInput, FloatingSelect, FloatingDatePicker } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import { ReusableTable, Column, QuickAction } from "@/components/ui/ReusableTable";
import { Partner, PartnerProfitPayment } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { formatAmount } from "@/utils/format";
import { Loader2, Pencil, Trash2, X, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";

const MONTH_NAMES_BN = ["", "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const MONTH_NAMES_EN = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const EMPTY_PARTNER: Partial<Partner> = { name_bn: "", name_en: "", equity_percentage: "0", invested_amount: "0" };
const NOW       = new Date();
const CUR_YEAR  = NOW.getFullYear();
const CUR_MONTH = NOW.getMonth() + 1;
const TODAY_STR = `${CUR_YEAR}-${String(CUR_MONTH).padStart(2, "0")}-${String(NOW.getDate()).padStart(2, "0")}`;

function lastDayOf(year: number, month: number) {
  // month is 1-indexed; new Date(year, month, 0) gives last day because
  // day=0 of the next 0-indexed month = last day of the current month
  const d = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ─── Payment History Modal ─────────────────────────────────────────────────────
function PaymentHistoryModal({
  partner,
  onClose,
  isBn,
}: {
  partner: Partner;
  onClose: () => void;
  isBn: boolean;
}) {
  const locale = useLocale();
  const { data, isLoading } = useGetPartnerPaymentsQuery(partner.id);
  const [createPayment, { isLoading: creating }] = useCreatePartnerPaymentMutation();
  const [updatePayment, { isLoading: updating }] = useUpdatePartnerPaymentMutation();
  const [deletePayment] = useDeletePartnerPaymentMutation();

  const [showForm, setShowForm]         = useState(false);
  const [editingPayment, setEditingPayment] = useState<PartnerProfitPayment | null>(null);
  const [form, setForm] = useState({
    year: CUR_YEAR, month: CUR_MONTH,
    paid_amount: "", paid_date: TODAY_STR, note: "",
  });

  // Auto-fetch P&L for selected month — skipped in edit mode
  const fromDate = `${form.year}-${String(form.month).padStart(2, "0")}-01`;
  const toDate   = lastDayOf(form.year, form.month);
  const { data: plData, isFetching: fetchingPL } = useGetProfitLossQuery(
    { from: fromDate, to: toDate },
    { skip: !showForm || !!editingPayment },
  );

  const netProfit = plData ? parseFloat(plData.net_profit) : 0;
  const autoShare = plData
    ? ((netProfit * parseFloat(partner.equity_percentage)) / 100).toFixed(2)
    : "";

  const totalBalance = data
    ? (parseFloat(data.total_share) - parseFloat(data.total_paid)).toFixed(2)
    : "0";

  const yearOptions = useMemo(() =>
    Array.from({ length: CUR_YEAR - 2019 + 2 }, (_, i) => ({
      value: String(2020 + i), label: String(2020 + i),
    })), []);

  const monthOptions = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: isBn ? MONTH_NAMES_BN[i + 1] : MONTH_NAMES_EN[i + 1],
    })), [isBn]);

  const openCreate = () => {
    setEditingPayment(null);
    setForm({ year: CUR_YEAR, month: CUR_MONTH, paid_amount: "", paid_date: TODAY_STR, note: "" });
    setShowForm(true);
  };

  const openEdit = (p: PartnerProfitPayment) => {
    setEditingPayment(p);
    setForm({ year: p.year, month: p.month, paid_amount: p.paid_amount, paid_date: p.paid_date ?? TODAY_STR, note: p.note });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingPayment(null); };

  const handleSave = async () => {
    try {
      if (editingPayment) {
        await updatePayment({
          partnerId: partner.id,
          id: editingPayment.id,
          paid_amount: form.paid_amount || "0",
          paid_date: form.paid_date || null,
          note: form.note,
        }).unwrap();
        toast.success(isBn ? "আপডেট হয়েছে" : "Updated");
      } else {
        if (!plData || fetchingPL) {
          toast.error(isBn ? "লাভ-ক্ষতির তথ্য অপেক্ষা করুন" : "Please wait for P&L data");
          return;
        }
        await createPayment({
          partnerId: partner.id,
          year: form.year,
          month: form.month,
          total_profit: plData.net_profit,
          share_amount: autoShare,
          paid_amount: form.paid_amount || "0",
          paid_date: form.paid_date || null,
          note: form.note,
        }).unwrap();
        toast.success(isBn ? "রেকর্ড করা হয়েছে" : "Recorded");
      }
      closeForm();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        (isBn ? "ব্যর্থ হয়েছে" : "Failed");
      toast.error(msg);
    }
  };

  const handleDelete = async (p: PartnerProfitPayment) => {
    try {
      await deletePayment({ partnerId: partner.id, id: p.id }).unwrap();
      toast.success(isBn ? "মুছে ফেলা হয়েছে" : "Deleted");
    } catch { toast.error(isBn ? "ব্যর্থ" : "Failed"); }
  };

  const paymentColumns: Column<PartnerProfitPayment>[] = [
    {
      header: isBn ? "মাস / বছর" : "Month / Year",
      accessor: (p) => (
        <div>
          <p className="font-medium text-gray-800">
            {isBn ? MONTH_NAMES_BN[p.month] : MONTH_NAMES_EN[p.month]} {p.year}
          </p>
          {p.note && <p className="text-xs text-gray-400">{p.note}</p>}
        </div>
      ),
    },
    {
      header: isBn ? "নিট লাভ" : "Net Profit",
      accessor: (p) => <span className="text-gray-600">{formatAmount(p.total_profit, locale)}</span>,
      headerClassName: "px-4 py-3 text-right text-xs font-bold text-amber-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-right",
    },
    {
      header: isBn ? "প্রাপ্য" : "Share",
      accessor: (p) => <span className="font-semibold text-green-600">{formatAmount(p.share_amount, locale)}</span>,
      headerClassName: "px-4 py-3 text-right text-xs font-bold text-amber-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-right",
    },
    {
      header: isBn ? "পরিশোধ" : "Paid",
      accessor: (p) => <span className="text-blue-600">{formatAmount(p.paid_amount, locale)}</span>,
      headerClassName: "px-4 py-3 text-right text-xs font-bold text-amber-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-right",
    },
    {
      header: isBn ? "বাকি" : "Balance",
      accessor: (p) => (
        <span className={`font-semibold ${parseFloat(p.balance) > 0 ? "text-amber-600" : "text-gray-400"}`}>
          {formatAmount(p.balance, locale)}
        </span>
      ),
      headerClassName: "px-4 py-3 text-right text-xs font-bold text-amber-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-right",
    },
    {
      header: isBn ? "তারিখ" : "Paid Date",
      accessor: (p) => <span className="text-xs text-gray-400">{p.paid_date ?? "—"}</span>,
      headerClassName: "px-4 py-3 text-right text-xs font-bold text-amber-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-right",
    },
  ];

  const paymentActions: QuickAction<PartnerProfitPayment>[] = [
    {
      label: "Edit",
      icon: <Pencil className="w-3 h-3" />,
      onClick: openEdit,
      className: "inline-flex items-center justify-center w-7 h-7 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors",
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-3 h-3" />,
      onClick: handleDelete,
      className: "inline-flex items-center justify-center w-7 h-7 rounded-lg border border-red-100 bg-red-50 text-red-400 hover:bg-red-100 transition-colors",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 className="font-bold text-gray-800">{partner.name_bn}</h2>
            <p className="text-xs text-gray-400">
              {partner.name_en && `${partner.name_en} · `}
              {partner.equity_percentage}% {isBn ? "ইক্যুইটি" : "equity"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!showForm && (
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                {isBn ? "+ মাস রেকর্ড" : "+ Record Month"}
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* All-time summary */}
        {data && (
          <div className="grid grid-cols-3 gap-3 px-6 py-4 bg-gray-50 border-b shrink-0">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-0.5">{isBn ? "মোট প্রাপ্য (সর্বকাল)" : "Total Share (all time)"}</p>
              <p className="font-bold text-green-600">{formatAmount(data.total_share, locale)}</p>
            </div>
            <div className="text-center border-x">
              <p className="text-xs text-gray-500 mb-0.5">{isBn ? "মোট পরিশোধ" : "Total Paid"}</p>
              <p className="font-bold text-blue-600">{formatAmount(data.total_paid, locale)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-0.5">{isBn ? "বাকি" : "Outstanding"}</p>
              <p className={`font-bold ${parseFloat(totalBalance) > 0 ? "text-amber-600" : "text-gray-400"}`}>
                {formatAmount(totalBalance, locale)}
              </p>
            </div>
          </div>
        )}

        {/* Record form */}
        {showForm && (
          <div className="px-6 py-5 bg-amber-50 border-b shrink-0">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {editingPayment
                ? `${isBn ? "পেমেন্ট আপডেট" : "Update Payment"} — ${isBn ? MONTH_NAMES_BN[editingPayment.month] : MONTH_NAMES_EN[editingPayment.month]} ${editingPayment.year}`
                : (isBn ? "মাসিক লাভ রেকর্ড" : "Record Monthly Profit")}
            </h3>

            {!editingPayment ? (
              <>
                {/* Month/Year selectors */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <FloatingSelect
                    label={isBn ? "বছর" : "Year"}
                    value={String(form.year)}
                    onChange={(v) => setForm((p) => ({ ...p, year: parseInt(v) || p.year }))}
                    options={yearOptions}
                    searchable={false}
                    showClearButton={false}
                  />
                  <FloatingSelect
                    label={isBn ? "মাস" : "Month"}
                    value={String(form.month)}
                    onChange={(v) => setForm((p) => ({ ...p, month: parseInt(v) || p.month }))}
                    options={monthOptions}
                    searchable={false}
                    showClearButton={false}
                  />
                </div>

                {/* Auto-fetched P&L result */}
                <div className="mb-4 p-4 rounded-xl border bg-white">
                  {fetchingPL ? (
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      {isBn ? "লাভ-ক্ষতি গণনা হচ্ছে..." : "Calculating P&L..."}
                    </div>
                  ) : plData ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{isBn ? "নিট লাভ (P&L থেকে)" : "Net Profit (from P&L)"}</p>
                        <p className={`text-xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatAmount(plData.net_profit, locale)}
                        </p>
                        {netProfit < 0 && (
                          <p className="text-xs text-red-500 mt-0.5">
                            {isBn ? "⚠ এই মাসে ক্ষতি হয়েছে" : "⚠ Loss recorded this month"}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-0.5">
                          {isBn ? `অংশীদারের প্রাপ্য (${partner.equity_percentage}%)` : `Share (${partner.equity_percentage}%)`}
                        </p>
                        <p className="text-xl font-bold text-amber-600">
                          {autoShare ? formatAmount(autoShare, locale) : "৳ 0.00"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">{isBn ? "তথ্য পাওয়া যাচ্ছে না" : "No P&L data available"}</p>
                  )}
                </div>
              </>
            ) : (
              /* Edit mode: locked summary */
              <div className="mb-4 p-4 rounded-xl border bg-white flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">{isBn ? "নিট লাভ" : "Net Profit"}</p>
                  <p className="text-xl font-bold text-green-600">{formatAmount(editingPayment.total_profit, locale)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-0.5">{isBn ? "প্রাপ্য অংশ" : "Share Amount"}</p>
                  <p className="text-xl font-bold text-amber-600">{formatAmount(editingPayment.share_amount, locale)}</p>
                </div>
              </div>
            )}

            {/* Payment fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <FloatingInput
                  label={isBn ? "পরিশোধিত পরিমাণ (৳)" : "Paid Amount (৳)"}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.paid_amount}
                  onChange={(e) => setForm((p) => ({ ...p, paid_amount: e.target.value }))}
                />
                {!editingPayment && autoShare && parseFloat(autoShare) > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, paid_amount: autoShare }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                  >
                    {isBn ? "পূর্ণ" : "Full"}
                  </button>
                )}
              </div>
              <FloatingDatePicker
                label={isBn ? "পরিশোধের তারিখ" : "Paid Date"}
                value={form.paid_date}
                onChange={(v) => setForm((p) => ({ ...p, paid_date: v }))}
                clearable
              />
              <div className="col-span-2">
                <FloatingInput
                  label={isBn ? "নোট (ঐচ্ছিক)" : "Note (optional)"}
                  value={form.note}
                  onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSave}
                disabled={creating || updating || (!editingPayment && fetchingPL)}
                className="btn-primary"
              >
                {creating || updating
                  ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...")
                  : (isBn ? "সংরক্ষণ করুন" : "Save")}
              </button>
              <button onClick={closeForm} className="btn-secondary">
                {isBn ? "বাতিল" : "Cancel"}
              </button>
            </div>
          </div>
        )}

        {/* Payment history table */}
        <div className="overflow-auto flex-1 px-6 py-4">
          <ReusableTable<PartnerProfitPayment>
            data={data?.payments ?? []}
            columns={paymentColumns}
            keyExtractor={(p) => p.id}
            isLoading={isLoading}
            quickActions={paymentActions}
            emptyMessage={
              isBn
                ? "কোনো রেকর্ড নেই — '+ মাস রেকর্ড' বাটন দিয়ে শুরু করুন"
                : "No records yet — click '+ Record Month' above"
            }
            skeletonRows={4}
            exportFilename={`partner-payments-${partner.name_en || partner.name_bn}`}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PartnersPage() {
  const locale = useLocale();
  const isBn   = locale === "bn";

  const { data: partners = [], isLoading } = useGetPartnersQuery();
  const [createPartner, { isLoading: creating }] = useCreatePartnerMutation();
  const [updatePartner, { isLoading: updating }] = useUpdatePartnerMutation();
  const [deletePartner] = useDeletePartnerMutation();

  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState<Partner | null>(null);
  const [form, setForm]               = useState<Partial<Partner>>(EMPTY_PARTNER);
  const [historyPartner, setHistoryPartner] = useState<Partner | null>(null);

  const totalEquity      = partners.reduce((s, p) => s + parseFloat(p.equity_percentage),    0);
  const totalInvested    = partners.reduce((s, p) => s + parseFloat(p.invested_amount || "0"), 0);
  const totalOutstanding = partners.reduce((s, p) => s + parseFloat(p.total_balance   || "0"), 0);

  const openCreate = () => { setEditing(null); setForm(EMPTY_PARTNER); setShowForm(true); };
  const openEdit   = (p: Partner) => {
    setEditing(p);
    setForm({ name_bn: p.name_bn, name_en: p.name_en, equity_percentage: p.equity_percentage, invested_amount: p.invested_amount });
    setShowForm(true);
  };
  const close = () => { setShowForm(false); setEditing(null); setForm(EMPTY_PARTNER); };

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name_bn) { toast.error(isBn ? "নাম আবশ্যক" : "Name required"); return; }
    try {
      if (editing) {
        await updatePartner({ id: editing.id, ...form }).unwrap();
        toast.success(isBn ? "আপডেট হয়েছে" : "Updated");
      } else {
        await createPartner(form).unwrap();
        toast.success(isBn ? "অংশীদার তৈরি হয়েছে" : "Partner created");
      }
      close();
    } catch { toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed"); }
  };

  const handleDelete = async (p: Partner) => {
    try {
      await deletePartner(p.id).unwrap();
      toast.success(isBn ? "মুছে ফেলা হয়েছে" : "Deleted");
    } catch { toast.error(isBn ? "ব্যর্থ" : "Failed"); }
  };

  const columns: Column<Partner>[] = [
    {
      header: isBn ? "নাম" : "Name",
      accessor: (p) => (
        <div>
          <p className="font-semibold text-gray-800">{p.name_bn}</p>
          {p.name_en && <p className="text-xs text-gray-400">{p.name_en}</p>}
        </div>
      ),
    },
    {
      header: isBn ? "বিনিয়োগ" : "Invested",
      accessor: (p) => (
        <span className="font-semibold text-gray-700">{formatAmount(p.invested_amount || "0", locale)}</span>
      ),
      headerClassName: "px-4 py-3 text-right text-xs font-bold text-amber-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-right",
    },
    {
      header: isBn ? "ইক্যুইটি %" : "Equity %",
      accessor: (p) => (
        <span className="inline-block px-3 py-1 rounded-full text-sm font-bold text-amber-700 bg-amber-50 border border-amber-100">
          {p.equity_percentage}%
        </span>
      ),
      headerClassName: "px-4 py-3 text-center text-xs font-bold text-amber-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-center",
    },
    {
      header: isBn ? "মোট প্রাপ্য" : "Total Share",
      accessor: (p) => (
        <span className="font-semibold text-green-600">{formatAmount(p.total_share || "0", locale)}</span>
      ),
      headerClassName: "px-4 py-3 text-right text-xs font-bold text-amber-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-right",
    },
    {
      header: isBn ? "পরিশোধ" : "Paid",
      accessor: (p) => (
        <span className="text-blue-600">{formatAmount(p.total_paid || "0", locale)}</span>
      ),
      headerClassName: "px-4 py-3 text-right text-xs font-bold text-amber-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-right",
    },
    {
      header: isBn ? "বাকি" : "Balance",
      accessor: (p) => (
        <span className={`font-bold ${parseFloat(p.total_balance || "0") > 0 ? "text-amber-600" : "text-gray-400"}`}>
          {formatAmount(p.total_balance || "0", locale)}
        </span>
      ),
      headerClassName: "px-4 py-3 text-right text-xs font-bold text-amber-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm text-right",
    },
    {
      header: isBn ? "ইতিহাস" : "History",
      accessor: (p) => (
        <div className="flex justify-center">
          <button
            onClick={() => setHistoryPartner(p)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
          >
            {isBn ? "দেখুন" : "View"} <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      ),
      headerClassName: "px-4 py-3 text-center text-xs font-bold text-amber-600 uppercase tracking-wider",
      className: "px-4 py-3 text-sm",
    },
  ];

  const quickActions: QuickAction<Partner>[] = [
    {
      label: isBn ? "সম্পাদনা" : "Edit",
      icon: <Pencil className="w-3.5 h-3.5" />,
      onClick: openEdit,
      className: "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors",
    },
    {
      label: isBn ? "মুছুন" : "Delete",
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: handleDelete,
      className: "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-100 bg-red-50 text-red-400 hover:bg-red-100 transition-colors",
    },
  ];

  return (
    <div className="max-w-7xl">
      <PageHeader
        title={isBn ? "অংশীদার / মূলধন" : "Partners / Equity"}
        addLabel={isBn ? "+ যোগ করুন" : "+ Add Partner"}
        onAdd={openCreate}
      />

      {/* Summary cards */}
      {partners.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card text-center py-4">
            <p className="text-xs text-gray-500 mb-1">{isBn ? "মোট বিনিয়োগ" : "Total Invested"}</p>
            <p className="text-2xl font-bold text-amber-600">{formatAmount(String(totalInvested), locale)}</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-xs text-gray-500 mb-1">{isBn ? "মোট অংশীদার" : "Partners"}</p>
            <p className="text-2xl font-bold text-gray-800">{partners.length}</p>
          </div>
          <div className={`card text-center py-4 ${Math.abs(totalEquity - 100) < 0.01 ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
            <p className="text-xs text-gray-500 mb-1">{isBn ? "মোট ইক্যুইটি" : "Total Equity"}</p>
            <p className={`text-2xl font-bold ${Math.abs(totalEquity - 100) < 0.01 ? "text-green-600" : "text-amber-600"}`}>
              {totalEquity.toFixed(2)}%
            </p>
          </div>
          <div className={`card text-center py-4 ${totalOutstanding > 0 ? "border-red-100 bg-red-50" : ""}`}>
            <p className="text-xs text-gray-500 mb-1">{isBn ? "মোট বাকি" : "Outstanding"}</p>
            <p className={`text-2xl font-bold ${totalOutstanding > 0 ? "text-red-600" : "text-gray-400"}`}>
              {formatAmount(String(totalOutstanding.toFixed(2)), locale)}
            </p>
          </div>
        </div>
      )}

      <ReusableTable<Partner>
        data={partners}
        columns={columns}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        quickActions={quickActions}
        emptyMessage={isBn ? "কোনো অংশীদার নেই" : "No partners yet"}
        skeletonRows={4}
        exportFilename="partners"
      />

      {/* Partner create/edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800">
                {editing ? (isBn ? "অংশীদার সম্পাদনা" : "Edit Partner") : (isBn ? "নতুন অংশীদার" : "New Partner")}
              </h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <FloatingInput label={isBn ? "নাম (বাংলা) *" : "Name (Bangla) *"} value={form.name_bn ?? ""} onChange={f("name_bn")} />
            <FloatingInput label={isBn ? "নাম (ইংরেজি)" : "Name (English)"} value={form.name_en ?? ""} onChange={f("name_en")} />
            <FloatingInput
              label={isBn ? "বিনিয়োগকৃত পরিমাণ (৳)" : "Invested Amount (৳)"}
              type="number" min="0" step="0.01"
              value={form.invested_amount ?? ""}
              onChange={f("invested_amount")}
            />
            <FloatingInput
              label={isBn ? "ইক্যুইটি % *" : "Equity % *"}
              type="number" min="0" max="100" step="0.01"
              value={form.equity_percentage ?? ""}
              onChange={f("equity_percentage")}
            />
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={creating || updating} className="flex-1 btn-primary">
                {creating || updating ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save")}
              </button>
              <button onClick={close} className="flex-1 btn-secondary">{isBn ? "বাতিল" : "Cancel"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment history modal */}
      {historyPartner && (
        <PaymentHistoryModal
          partner={historyPartner}
          onClose={() => setHistoryPartner(null)}
          isBn={isBn}
        />
      )}
    </div>
  );
}

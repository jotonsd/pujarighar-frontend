"use client";

import {
  ManualJournalLine,
  useCreateManualJournalMutation,
  useGetAccountsQuery,
  useGetJournalEntriesQuery,
} from "@/api/accounting/accountingApi";
import Badge from "@/components/ui/Badge";
import { FloatingInput, FloatingSelect } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/skeletons";
import { toast } from "@/store/toastStore";
import { formatAmount } from "@/utils/format";
import { Plus, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const REF_TYPES = [
  { value: "EXPENSE", label_bn: "খরচ", label_en: "Expense" },
  { value: "EQUITY", label_bn: "ইক্যুইটি", label_en: "Equity" },
  { value: "ADJUSTMENT", label_bn: "সমন্বয়", label_en: "Adjustment" },
  { value: "PURCHASE", label_bn: "ক্রয়", label_en: "Purchase" },
];

const EMPTY_LINE = (): ManualJournalLine => ({
  account_code: "",
  debit: "",
  credit: "",
  memo_bn: "",
});

// ─── Manual Entry Modal ───────────────────────────────────────────────────────
function ManualEntryModal({
  onClose,
  isBn,
}: {
  onClose: () => void;
  isBn: boolean;
}) {
  const { data: accounts = [] } = useGetAccountsQuery();
  const [createJournal, { isLoading }] = useCreateManualJournalMutation();

  const [refType, setRefType] = useState<
    "EXPENSE" | "EQUITY" | "ADJUSTMENT" | "PURCHASE"
  >("EXPENSE");
  const [descBn, setDescBn] = useState("");
  const [descEn, setDescEn] = useState("");
  const [lines, setLines] = useState<ManualJournalLine[]>([
    EMPTY_LINE(),
    EMPTY_LINE(),
  ]);

  const totalDebit = lines.reduce(
    (s, l) => s + (parseFloat(l.debit || "0") || 0),
    0,
  );
  const totalCredit = lines.reduce(
    (s, l) => s + (parseFloat(l.credit || "0") || 0),
    0,
  );
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const updateLine = (i: number, key: keyof ManualJournalLine, val: string) =>
    setLines(prev =>
      prev.map((l, idx) => (idx === i ? { ...l, [key]: val } : l)),
    );

  const addLine = () => setLines(prev => [...prev, EMPTY_LINE()]);
  const removeLine = (i: number) =>
    setLines(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!descBn.trim()) {
      toast.error(isBn ? "বিবরণ আবশ্যক" : "Description required");
      return;
    }
    const validLines = lines.filter(
      l =>
        l.account_code &&
        (parseFloat(l.debit || "0") > 0 || parseFloat(l.credit || "0") > 0),
    );
    if (validLines.length < 2) {
      toast.error(
        isBn ? "কমপক্ষে ২টি লাইন প্রয়োজন" : "At least 2 lines required",
      );
      return;
    }
    if (!balanced) {
      toast.error(
        isBn ? "ডেবিট ও ক্রেডিট সমান হতে হবে" : "Debits must equal credits",
      );
      return;
    }
    try {
      await createJournal({
        description_bn: descBn,
        description_en: descEn,
        reference_type: refType,
        lines: validLines,
      }).unwrap();
      toast.success(
        isBn ? "জার্নাল এন্ট্রি তৈরি হয়েছে" : "Journal entry created",
      );
      onClose();
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed");
    }
  };

  const typeLabel: Record<string, string> = {
    ASSET: isBn ? "সম্পদ" : "Asset",
    LIABILITY: isBn ? "দায়" : "Liability",
    EQUITY: isBn ? "মূলধন" : "Equity",
    REVENUE: isBn ? "আয়" : "Revenue",
    EXPENSE: isBn ? "খরচ" : "Expense",
  };

  // Flat account options sorted by code — type shown in brackets
  const acctOptions = [...accounts]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(a => ({
      value: a.code,
      label: `${a.code} — ${isBn ? a.name_bn : a.name_en} (${typeLabel[a.account_type] ?? a.account_type})`,
    }));

  const typeOptions = REF_TYPES.map(r => ({
    value: r.value,
    label: isBn ? r.label_bn : r.label_en,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="font-bold text-gray-800">
            {isBn ? "নতুন জার্নাল এন্ট্রি" : "New Journal Entry"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-auto flex-1 px-6 py-4 space-y-4">
          {/* Meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FloatingSelect
              label={isBn ? "ধরন" : "Type"}
              value={refType}
              onChange={v => setRefType(v as typeof refType)}
              options={typeOptions}
              searchable={false}
              showClearButton={false}
            />
            <FloatingInput
              label={isBn ? "বিবরণ (বাংলা) *" : "Description (BN) *"}
              value={descBn}
              onChange={e => setDescBn(e.target.value)}
            />
            <FloatingInput
              label={isBn ? "বিবরণ (ইংরেজি)" : "Description (EN)"}
              value={descEn}
              onChange={e => setDescEn(e.target.value)}
            />
          </div>

          {/* Lines */}
          <div>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[2fr_110px_110px_1fr_auto] gap-2 items-center"
                >
                  <FloatingSelect
                    label={isBn ? "অ্যাকাউন্ট" : "Account"}
                    value={line.account_code}
                    onChange={v => updateLine(i, "account_code", v)}
                    options={acctOptions}
                    searchPlaceholder={
                      isBn ? "কোড বা নাম..." : "Code or name..."
                    }
                    showClearButton={false}
                    dropdownZIndex={1010}
                  />
                  <FloatingInput
                    label={isBn ? "ডেবিট" : "Debit"}
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.debit}
                    onChange={e => updateLine(i, "debit", e.target.value)}
                  />
                  <FloatingInput
                    label={isBn ? "ক্রেডিট" : "Credit"}
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.credit}
                    onChange={e => updateLine(i, "credit", e.target.value)}
                  />
                  <FloatingInput
                    label={isBn ? "নোট" : "Note"}
                    value={line.memo_bn || ""}
                    onChange={e => updateLine(i, "memo_bn", e.target.value)}
                  />
                  <button
                    onClick={() => removeLine(i)}
                    disabled={lines.length <= 2}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-400 hover:bg-red-100 transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addLine}
              className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />{" "}
              {isBn ? "লাইন যোগ করুন" : "Add line"}
            </button>
          </div>

          {/* Totals */}
          <div
            className={`flex justify-end gap-8 px-4 py-3 rounded-xl text-sm font-semibold ${balanced ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}
          >
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-0.5">
                {isBn ? "মোট ডেবিট" : "Total Debit"}
              </p>
              <p className="text-gray-800">
                {formatAmount(String(totalDebit.toFixed(2)), "en")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-0.5">
                {isBn ? "মোট ক্রেডিট" : "Total Credit"}
              </p>
              <p className="text-gray-800">
                {formatAmount(String(totalCredit.toFixed(2)), "en")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-0.5">
                {isBn ? "পার্থক্য" : "Difference"}
              </p>
              <p className={balanced ? "text-green-600" : "text-amber-600"}>
                {balanced
                  ? isBn
                    ? "✓ সুষম"
                    : "✓ Balanced"
                  : formatAmount(
                      String(Math.abs(totalDebit - totalCredit).toFixed(2)),
                      "en",
                    )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t shrink-0">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !balanced}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            {isLoading
              ? isBn
                ? "সংরক্ষণ হচ্ছে..."
                : "Saving..."
              : isBn
                ? "জমা করুন"
                : "Post Entry"}
          </button>
          <button onClick={onClose} className="flex-1 btn-secondary">
            {isBn ? "বাতিল" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type BadgeVariant = "green" | "red" | "yellow" | "blue" | "gray" | "orange" | "purple";
const REF_BADGE: Record<
  string,
  { variant: BadgeVariant; label_bn: string; label_en: string }
> = {
  SALE:     { variant: "green",  label_bn: "বিক্রয়",  label_en: "Sale" },
  PAYMENT:  { variant: "green",  label_bn: "পেমেন্ট", label_en: "Payment" },
  PURCHASE: { variant: "blue",   label_bn: "ক্রয়",    label_en: "Purchase" },
  RETURN: { variant: "yellow", label_bn: "ফেরত", label_en: "Return" },
  EXPENSE: { variant: "orange", label_bn: "খরচ", label_en: "Expense" },
  EQUITY: { variant: "blue", label_bn: "ইক্যুইটি", label_en: "Equity" },
  ADJUSTMENT: { variant: "gray", label_bn: "সমন্বয়", label_en: "Adjustment" },
  SUPPLIER_PAYMENT: {
    variant: "green",
    label_bn: "সরবরাহকারী পেমেন্ট",
    label_en: "Supplier Payment",
  },
  CAPITAL: {
    variant: "blue",
    label_bn: "মূলধন বিনিয়োগ",
    label_en: "Capital Contribution",
  },
  LOAN_RECEIVED: {
    variant: "blue",
    label_bn: "ঋণ গ্রহণ",
    label_en: "Loan Received",
  },
  LOAN_INTEREST: {
    variant: "orange",
    label_bn: "সুদ পরিশোধ",
    label_en: "Interest Payment",
  },
  LOAN_PRINCIPAL: {
    variant: "yellow",
    label_bn: "ঋণ পরিশোধ",
    label_en: "Principal Repayment",
  },
  CASHBACK: {
    variant: "purple",
    label_bn: "ক্যাশব্যাক",
    label_en: "Cashback",
  },
};

export default function JournalPage() {
  const t = useTranslations("accounting");
  const locale = useLocale();
  const isBn = locale === "bn";
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useGetJournalEntriesQuery({ page });
  const entries = data?.data ?? [];
  const totalPages = data?.meta?.total_pages ?? 1;

  return (
    <div>
      <PageHeader
        title={t("journal")}
        description={
          isBn
            ? "সকল জার্নাল এন্ট্রি দেখুন ও ম্যানুয়াল এন্ট্রি তৈরি করুন"
            : "View all journal entries and create manual entries"
        }
        addLabel={isBn ? "নতুন এন্ট্রি" : "New Entry"}
        onAdd={() => setShowForm(true)}
      />

      {isLoading ? (
        <TableSkeleton columns={7} rows={8} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  {isBn ? "জার্নাল নং" : "Entry #"}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  {isBn ? "ধরন" : "Type"}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  {isBn ? "বিবরণ" : "Description"}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  {isBn ? "অ্যাকাউন্ট" : "Account"}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  {t("debit")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  {t("credit")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  {isBn ? "তারিখ" : "Date"}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    {isBn ? "কোনো এন্ট্রি নেই" : "No journal entries"}
                  </td>
                </tr>
              )}

              {entries.map((entry, ei) => {
                const badge = REF_BADGE[entry.reference_type] ?? {
                  variant: "gray",
                  label_bn: entry.reference_type,
                  label_en: entry.reference_type,
                };
                return entry.lines.map((line, li) => {
                  const isFirst = li === 0;
                  const isLast = li === entry.lines.length - 1;
                  const isEven = ei % 2 === 0;

                  return (
                    <tr
                      key={line.id}
                      className={`border-b ${isLast ? "border-gray-200" : "border-gray-50"} ${isEven ? "bg-white" : "bg-gray-50/40"}`}
                    >
                      <td className="px-4 py-2 font-mono text-xs text-gray-400 align-top whitespace-nowrap">
                        {isFirst ? entry.entry_number : ""}
                      </td>

                      <td className="px-4 py-2 align-top">
                        {isFirst && (
                          <Badge variant={badge.variant}>
                            {isBn ? badge.label_bn : badge.label_en}
                          </Badge>
                        )}
                      </td>

                      <td className="px-4 py-2 text-gray-800 font-medium align-top max-w-[160px] truncate">
                        {isFirst
                          ? isBn
                            ? entry.description_bn
                            : entry.description_en
                          : ""}
                      </td>

                      <td className="px-4 py-2 text-gray-700">
                        <span className="font-mono text-gray-400 text-xs mr-1.5">
                          {line.account_code}
                        </span>
                        {isBn ? line.account_name_bn : line.account_name_en}
                      </td>

                      <td className="px-4 py-2 text-right font-bold text-gray-800">
                        {Number(line.debit) ? (
                          formatAmount(line.debit, locale, 0)
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      <td className="px-4 py-2 text-right font-bold text-gray-800">
                        {Number(line.credit) ? (
                          formatAmount(line.credit, locale, 0)
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      <td className="px-4 py-2 text-xs text-gray-500 align-top whitespace-nowrap">
                        {isFirst
                          ? new Date(entry.created_at).toLocaleDateString(
                              isBn ? "bn-BD" : "en-US",
                            )
                          : ""}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {isBn
                  ? `পেজ ${page} / ${totalPages}`
                  : `Page ${page} of ${totalPages}`}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  {isBn ? "পূর্ববর্তী" : "Prev"}
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  {isBn ? "পরবর্তী" : "Next"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <ManualEntryModal onClose={() => setShowForm(false)} isBn={isBn} />
      )}
    </div>
  );
}

"use client";
import { formatAmount } from "@/utils/format";
import { useGetTrialBalanceQuery } from "@/api/accounting/accountingApi";
import { FloatingDatePicker } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/skeletons";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

export default function TrialBalancePage() {
  const t      = useTranslations("accounting");
  const locale = useLocale();
  const [asOf, setAsOf] = useState("");

  const { data: tb, isLoading } = useGetTrialBalanceQuery({ asOf });

  const totalDebit  = tb?.rows.reduce((s, r) => s + Number(r.debit),  0) ?? 0;
  const totalCredit = tb?.rows.reduce((s, r) => s + Number(r.credit), 0) ?? 0;
  const balanced    = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div>
      <PageHeader
        title={locale === "bn" ? "ট্রায়াল ব্যালেন্স" : "Trial Balance"}
        description={locale === "bn" ? "নির্দিষ্ট তারিখ পর্যন্ত সকল অ্যাকাউন্টের ডেবিট-ক্রেডিট সমষ্টি" : "Total debits and credits for all accounts up to a date"}
      />

      <div className="flex items-center gap-4 mb-6">
        <div className="w-56">
          <FloatingDatePicker label={locale === "bn" ? "তারিখ পর্যন্ত" : "As of date"} value={asOf} onChange={setAsOf} clearable />
        </div>
        {tb && (
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${
            balanced ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            <span>{balanced ? "✓" : "✗"}</span>
            <span>
              {balanced
                ? locale === "bn" ? "ব্যালেন্স সমান — সঠিক আছে" : "Balanced — Trial Balance is correct"
                : locale === "bn"
                  ? `ব্যালেন্স মিলছে না — পার্থক্য: ৳${Math.abs(totalDebit - totalCredit).toFixed(2)}`
                  : `Unbalanced — Difference: ৳${Math.abs(totalDebit - totalCredit).toFixed(2)}`}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton columns={4} rows={6} />
      ) : tb ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{t("account")}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{t("debit")}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{t("credit")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tb.rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.account.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{locale === "bn" ? r.account.name_bn : r.account.name_en}</td>
                  <td className="px-4 py-3 text-right text-sm">{Number(r.debit)  ? formatAmount(r.debit,  locale, 0) : "—"}</td>
                  <td className="px-4 py-3 text-right text-sm">{Number(r.credit) ? formatAmount(r.credit, locale, 0) : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-amber-200 bg-amber-50">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-xs font-bold text-gray-700 uppercase">
                  {locale === "bn" ? "মোট" : "Total"}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">{formatAmount(totalDebit,  locale, 0)}</td>
                <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">{formatAmount(totalCredit, locale, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : null}
    </div>
  );
}

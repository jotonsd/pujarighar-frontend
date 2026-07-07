"use client";

import { useGetAccountsQuery } from "@/api/accounting/accountingApi";
import { LedgerReport } from "@/api/reports/reportsApi";
import { FloatingDatePicker, FloatingSelect } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/skeletons";
import { formatAmount } from "@/utils/format";
import { useLocale } from "next-intl";
import { useState } from "react";

interface Props {
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  accountType: "REVENUE" | "EXPENSE";
  amountColorClass: string;
  useReportQuery: (
    args: { account_id?: string; from?: string; to?: string } | void,
  ) => { data?: LedgerReport; isLoading: boolean };
}

export default function LedgerReportView({
  titleBn, titleEn, descriptionBn, descriptionEn, accountType, amountColorClass, useReportQuery,
}: Props) {
  const locale = useLocale();
  const isBn = locale === "bn";

  const [accountId, setAccountId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: accounts = [] } = useGetAccountsQuery();
  const relevantAccounts = accounts.filter(a => a.account_type === accountType);

  const { data, isLoading } = useReportQuery({
    account_id: accountId || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const rows = data?.rows ?? [];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(isBn ? "bn-BD" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div>
      <PageHeader title={isBn ? titleBn : titleEn} description={isBn ? descriptionBn : descriptionEn} />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <FloatingSelect
          label={isBn ? "হিসাব" : "Account"}
          value={accountId}
          onChange={setAccountId}
          showClearButton={!!accountId}
          onClear={() => setAccountId("")}
          options={relevantAccounts.map(a => ({ value: a.id, label: isBn ? a.name_bn : a.name_en }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <FloatingDatePicker label={isBn ? "শুরু তারিখ" : "From"} value={from} onChange={setFrom} clearable />
          <FloatingDatePicker label={isBn ? "শেষ তারিখ" : "To"} value={to} onChange={setTo} clearable />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton columns={4} rows={8} />
      ) : rows.length === 0 ? (
        <p className="text-gray-400 text-sm">{isBn ? "কোনো তথ্য নেই" : "No data found"}</p>
      ) : (
        <div className="card p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "তারিখ" : "Date"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "হিসাব" : "Account"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "বিবরণ" : "Description"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "পরিমাণ" : "Amount"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 text-gray-800">
                    <div>{isBn ? r.account_name_bn : r.account_name_en}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{r.entry_number}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{isBn ? r.description_bn : r.description_en}</td>
                  <td className={`px-4 py-3 text-right text-xs font-bold ${amountColorClass}`}>{formatAmount(r.amount, locale, 2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-amber-200 bg-amber-50">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-xs font-bold text-gray-700">{isBn ? "সর্বমোট" : "Total"}</td>
                <td className={`px-4 py-3 text-right text-xs font-bold ${amountColorClass}`}>{formatAmount(data?.total_amount ?? "0", locale, 2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

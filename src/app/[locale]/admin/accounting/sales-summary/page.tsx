"use client";
import { formatAmount, formatNumber } from "@/utils/format";
import { useGetSalesSummaryQuery } from "@/api/accounting/accountingApi";
import { FloatingDatePicker, FloatingSelect } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/skeletons";
import { useLocale } from "next-intl";
import { useState } from "react";

export default function SalesSummaryPage() {
  const locale  = useLocale();
  const [from, setFrom]       = useState("");
  const [to, setTo]           = useState("");
  const [groupBy, setGroupBy] = useState("day");

  const { data, isLoading } = useGetSalesSummaryQuery({ from, to, group_by: groupBy });

  const rows      = data?.rows ?? [];
  const maxRev    = rows.length ? Math.max(...rows.map(r => Number(r.total_revenue))) : 1;

  const formatPeriod = (p: string) =>
    new Date(p).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US", {
      day:   groupBy === "month" ? undefined : "numeric",
      month: "short",
      year:  groupBy === "year"  ? "numeric"  : undefined,
    });

  return (
    <div>
      <PageHeader
        title={locale === "bn" ? "বিক্রয় সারসংক্ষেপ" : "Sales Summary"}
        description={locale === "bn" ? "পেইড অর্ডারের ভিত্তিতে বিক্রয় পরিসংখ্যান" : "Sales statistics based on paid orders"}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="w-44">
          <FloatingDatePicker label={locale === "bn" ? "শুরু তারিখ" : "From"} value={from} onChange={setFrom} clearable />
        </div>
        <div className="w-44">
          <FloatingDatePicker label={locale === "bn" ? "শেষ তারিখ" : "To"} value={to} onChange={setTo} clearable />
        </div>
        <div className="w-36">
          <FloatingSelect label={locale === "bn" ? "গ্রুপ" : "Group by"} value={groupBy} onChange={setGroupBy}>
            <option value="day">{locale === "bn" ? "দিন" : "Day"}</option>
            <option value="week">{locale === "bn" ? "সপ্তাহ" : "Week"}</option>
            <option value="month">{locale === "bn" ? "মাস" : "Month"}</option>
          </FloatingSelect>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton columns={3} rows={6} />
      ) : !data ? null : (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: locale === "bn" ? "মোট বিক্রয়" : "Total Revenue",
                value: formatAmount(data.total_revenue, locale),
                color: "text-green-600",
              },
              {
                label: locale === "bn" ? "মোট অর্ডার" : "Total Orders",
                value: formatNumber(data.total_orders, locale),
                color: "text-amber-600",
              },
              {
                label: locale === "bn" ? "গড় অর্ডার মূল্য" : "Avg Order Value",
                value: formatAmount(data.avg_order, locale),
                color: "text-blue-600",
              },
            ].map(c => (
              <div key={c.label} className="card py-3">
                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {rows.length === 0 ? (
            <p className="text-gray-400 text-sm">{locale === "bn" ? "কোনো তথ্য নেই" : "No data found"}</p>
          ) : (
            <div className="flex gap-3 items-start">
              {/* Bar chart */}
              <div className="card flex-1">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  {locale === "bn" ? "বিক্রয় চার্ট" : "Revenue Chart"}
                </h3>
                <div className="space-y-2">
                  {rows.map((r, i) => {
                    const pct = maxRev > 0 ? (Number(r.total_revenue) / maxRev) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-20 shrink-0 text-right">{formatPeriod(r.period)}</span>
                        <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-lg transition-all duration-300 flex items-center px-2"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          >
                            {pct > 25 && (
                              <span className="text-xs font-semibold text-white truncate">
                                {formatAmount(r.total_revenue, locale, 0)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-24 shrink-0">
                          {pct <= 25 ? formatAmount(r.total_revenue, locale, 0) : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Table */}
              <div className="card w-80 shrink-0 p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-amber-50 border-b border-amber-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600">
                        {locale === "bn" ? "সময়কাল" : "Period"}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600">
                        {locale === "bn" ? "অর্ডার" : "Orders"}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600">
                        {locale === "bn" ? "বিক্রয়" : "Revenue"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700 text-xs">{formatPeriod(r.period)}</td>
                        <td className="px-4 py-3 text-right text-xs text-gray-600">{formatNumber(r.order_count, locale)}</td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-amber-600">{formatAmount(r.total_revenue, locale, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-amber-200 bg-amber-50">
                    <tr>
                      <td className="px-4 py-3 text-xs font-bold text-gray-700">{locale === "bn" ? "মোট" : "Total"}</td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-gray-800">{formatNumber(data.total_orders, locale)}</td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-gray-800">{formatAmount(data.total_revenue, locale, 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

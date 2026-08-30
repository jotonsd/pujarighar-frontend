"use client";

import { useGetCartReportQuery } from "@/api/reports/reportsApi";
import { FloatingInput } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/skeletons";
import { formatAmount, formatDate, localName } from "@/utils/format";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import { Fragment, useState } from "react";

export default function CartReportPage() {
  const locale = useLocale();
  const isBn = locale === "bn";

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, isLoading } = useGetCartReportQuery({ search: search || undefined });
  const rows = data?.rows ?? [];

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <PageHeader
        title={isBn ? "কার্ট রিপোর্ট" : "Cart Report"}
        description={
          isBn
            ? "যেসব নিবন্ধিত গ্রাহক পণ্য কার্টে যোগ করেছেন কিন্তু এখনো অর্ডার করেননি তাদের তালিকা"
            : "Registered customers who've added items to their cart but haven't checked out yet"
        }
      />

      <div className="max-w-sm mb-4">
        <FloatingInput
          label={isBn ? "নাম, ফোন বা ইমেইল দিয়ে খুঁজুন" : "Search by name, phone, or email"}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={6} rows={8} />
      ) : rows.length === 0 ? (
        <p className="text-gray-400 text-sm">{isBn ? "কোনো সক্রিয় কার্ট নেই" : "No active carts found"}</p>
      ) : (
        <div className="card p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="w-8"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "গ্রাহক" : "Customer"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "পণ্য" : "Products"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "পরিমাণ" : "Quantity"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "কার্ট মূল্য" : "Cart Value"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "সর্বশেষ কার্যকলাপ" : "Last Activity"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => (
                <Fragment key={r.customer_id}>
                  <tr
                    onClick={() => toggle(r.customer_id)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="pl-4 text-gray-400">
                      {expanded.has(r.customer_id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      <div className="text-sm font-medium">{localName(r.name_bn, r.name_en, isBn) || "—"}</div>
                      <div className="text-[11px] text-gray-400">{r.phone}{r.email ? ` · ${r.email}` : ""}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-700">{r.item_count}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-700">{r.total_quantity}</td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-amber-700">{formatAmount(r.cart_value, locale, 2)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {r.last_activity ? formatDate(r.last_activity, locale) : "—"}
                    </td>
                  </tr>
                  {expanded.has(r.customer_id) && (
                    <tr className="bg-gray-50">
                      <td></td>
                      <td colSpan={5} className="px-4 py-3">
                        <div className="space-y-1.5">
                          {r.items.map((it, i) => (
                            <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                              <span>{isBn ? it.product_name_bn : it.product_name_en} × {it.quantity}</span>
                              <span className="font-medium">{formatAmount(it.unit_price, locale, 2)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-amber-200 bg-amber-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-xs font-bold text-gray-700">
                  {isBn ? "সর্বমোট" : "Total"} ({data?.total_carts ?? 0} {isBn ? "টি কার্ট" : "carts"})
                </td>
                <td className="px-4 py-3 text-right text-xs font-bold text-gray-800">{formatAmount(data?.total_value ?? "0", locale, 2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

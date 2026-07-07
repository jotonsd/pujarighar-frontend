"use client";

import { useGetSuppliersQuery } from "@/api/suppliers/suppliersApi";
import { FloatingInput } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/skeletons";
import { formatAmount } from "@/utils/format";
import { useLocale } from "next-intl";
import { useState } from "react";

export default function SupplierOutstandingReportPage() {
  const locale = useLocale();
  const isBn = locale === "bn";

  const [search, setSearch] = useState("");
  const [onlyOutstanding, setOnlyOutstanding] = useState(false);

  const { data: suppliers = [], isLoading } = useGetSuppliersQuery();

  const rows = suppliers
    .filter(s => {
      const q = search.toLowerCase();
      return !q || s.name_bn.toLowerCase().includes(q) || s.name_en.toLowerCase().includes(q);
    })
    .filter(s => !onlyOutstanding || parseFloat(s.total_balance || "0") > 0)
    .sort((a, b) => parseFloat(b.total_balance || "0") - parseFloat(a.total_balance || "0"));

  const totalCredit  = rows.reduce((s, x) => s + parseFloat(x.total_credit  || "0"), 0);
  const totalPaid    = rows.reduce((s, x) => s + parseFloat(x.total_paid    || "0"), 0);
  const totalBalance = rows.reduce((s, x) => s + parseFloat(x.total_balance || "0"), 0);

  return (
    <div>
      <PageHeader
        title={isBn ? "সরবরাহকারী বকেয়া রিপোর্ট" : "Supplier Outstanding Report"}
        description={isBn ? "প্রতিটি সরবরাহকারীর ক্রেডিট ক্রয়, পরিশোধ ও বকেয়া দেখুন" : "See each supplier's credit purchases, payments, and outstanding balance"}
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <FloatingInput
          label={isBn ? "সরবরাহকারী খুঁজুন" : "Search supplier"}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 px-1">
          <input
            type="checkbox"
            checked={onlyOutstanding}
            onChange={e => setOnlyOutstanding(e.target.checked)}
            className="accent-amber-600 w-4 h-4"
          />
          {isBn ? "শুধু বকেয়া আছে এমন সরবরাহকারী" : "Only suppliers with outstanding balance"}
        </label>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "সরবরাহকারী" : "Supplier"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "ফোন" : "Phone"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "মোট ক্রেডিট" : "Total Credit"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "পরিশোধ" : "Paid"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "বকেয়া" : "Outstanding"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(s => {
                const balance = parseFloat(s.total_balance || "0");
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-800">
                      <div className="font-medium">{isBn ? s.name_bn : s.name_en || s.name_bn}</div>
                      {!s.is_active && (
                        <span className="text-[10px] text-gray-400">{isBn ? "নিষ্ক্রিয়" : "Inactive"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.phone || "—"}</td>
                    <td className="px-4 py-3 text-right text-xs text-blue-700 font-semibold">{formatAmount(s.total_credit, locale, 0)}</td>
                    <td className="px-4 py-3 text-right text-xs text-green-700 font-semibold">{formatAmount(s.total_paid, locale, 0)}</td>
                    <td className={`px-4 py-3 text-right text-xs font-bold ${balance > 0 ? "text-red-600" : "text-gray-400"}`}>
                      {formatAmount(s.total_balance, locale, 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-amber-200 bg-amber-50">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-xs font-bold text-gray-700">{isBn ? "সর্বমোট" : "Total"}</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-gray-800">{formatAmount(totalCredit, locale, 0)}</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-gray-800">{formatAmount(totalPaid, locale, 0)}</td>
                <td className={`px-4 py-3 text-right text-xs font-bold ${totalBalance > 0 ? "text-red-700" : "text-gray-800"}`}>
                  {formatAmount(totalBalance, locale, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { useGetProductsQuery } from "@/api/products/productsApi";
import { useGetPurchaseReportQuery } from "@/api/reports/reportsApi";
import { useGetSuppliersQuery } from "@/api/suppliers/suppliersApi";
import { FloatingDatePicker, FloatingSelect } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/skeletons";
import { formatAmount, formatNumber } from "@/utils/format";
import { useLocale } from "next-intl";
import { useState } from "react";

export default function PurchaseReportPage() {
  const locale = useLocale();
  const isBn = locale === "bn";

  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: suppliers = [] } = useGetSuppliersQuery();
  const { data: productsRes } = useGetProductsQuery({ page_size: 500 });
  const products = productsRes?.data ?? [];

  const { data, isLoading } = useGetPurchaseReportQuery({
    supplier_id: supplierId || undefined,
    product_id: productId || undefined,
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
      <PageHeader
        title={isBn ? "ক্রয় রিপোর্ট" : "Purchase Report"}
        description={isBn ? "তারিখ, পণ্য বা সরবরাহকারী দিয়ে ক্রয়ের তালিকা দেখুন" : "View purchases filtered by date, product, or supplier"}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="w-52">
          <FloatingSelect
            label={isBn ? "সরবরাহকারী" : "Supplier"}
            value={supplierId}
            onChange={setSupplierId}
            showClearButton={!!supplierId}
            onClear={() => setSupplierId("")}
            options={suppliers.map(s => ({ value: s.id, label: isBn ? s.name_bn || s.name_en : s.name_en || s.name_bn }))}
          />
        </div>
        <div className="w-64">
          <FloatingSelect
            label={isBn ? "পণ্য" : "Product"}
            value={productId}
            onChange={setProductId}
            showClearButton={!!productId}
            onClear={() => setProductId("")}
            options={products.map(p => ({ value: p.id, label: isBn ? p.name_bn : p.name_en }))}
          />
        </div>
        <div className="w-44">
          <FloatingDatePicker label={isBn ? "শুরু তারিখ" : "From"} value={from} onChange={setFrom} clearable />
        </div>
        <div className="w-44">
          <FloatingDatePicker label={isBn ? "শেষ তারিখ" : "To"} value={to} onChange={setTo} clearable />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton columns={6} rows={8} />
      ) : rows.length === 0 ? (
        <p className="text-gray-400 text-sm">{isBn ? "কোনো তথ্য নেই" : "No data found"}</p>
      ) : (
        <div className="card p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "তারিখ" : "Date"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "পণ্য" : "Product"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "সরবরাহকারী" : "Supplier"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "পরিমাণ" : "Count"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "একক মূল্য" : "Unit Price"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "মোট" : "Total"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 text-gray-800">
                    <div>{isBn ? r.product_name_bn : r.product_name_en}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{r.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {r.supplier_name || "—"}
                    {r.payment_method === "CREDIT" && (
                      <span className="ml-1 text-[10px] text-blue-500">{isBn ? "(বাকি)" : "(credit)"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-700">{formatNumber(r.quantity, locale)}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-600">{formatAmount(r.unit_cost, locale, 2)}</td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-amber-600">{formatAmount(r.line_total, locale, 2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-amber-200 bg-amber-50">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-xs font-bold text-gray-700">{isBn ? "সর্বমোট" : "Total"}</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-gray-800">{formatNumber(data?.total_quantity ?? "0", locale)}</td>
                <td></td>
                <td className="px-4 py-3 text-right text-xs font-bold text-gray-800">{formatAmount(data?.total_amount ?? "0", locale, 2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

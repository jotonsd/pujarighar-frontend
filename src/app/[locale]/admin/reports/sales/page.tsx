"use client";

import { useGetSalesReportQuery } from "@/api/reports/reportsApi";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { FloatingDatePicker, FloatingSelect } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/skeletons";
import { OrderStatus } from "@/lib/types";
import { formatAmount, formatDate } from "@/utils/format";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PACKED", "ASSIGNED", "ON_THE_WAY", "DELIVERED", "RETURNED", "CANCELLED"];

export default function SalesReportPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isBn = locale === "bn";

  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading } = useGetSalesReportQuery({
    status: status || undefined,
    payment_status: paymentStatus || undefined,
    payment_method: paymentMethod || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const rows = data?.rows ?? [];

  return (
    <div>
      <PageHeader
        title={isBn ? "বিক্রয় রিপোর্ট" : "Sales Report"}
        description={isBn ? "প্রতিটি অর্ডার অনুযায়ী বিক্রয়ের বিস্তারিত তালিকা দেখুন" : "View a detailed, order-by-order breakdown of sales"}
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <FloatingSelect
          label={t("order.status")}
          value={status}
          onChange={setStatus}
          showClearButton={!!status}
          onClear={() => setStatus("")}
          options={STATUSES.map(s => ({ value: s, label: t(`order.${s}`) }))}
        />
        <FloatingSelect
          label={isBn ? "পেমেন্ট অবস্থা" : "Payment Status"}
          value={paymentStatus}
          onChange={setPaymentStatus}
          showClearButton={!!paymentStatus}
          onClear={() => setPaymentStatus("")}
          options={[
            { value: "PAID", label: isBn ? "পেইড" : "Paid" },
            { value: "UNPAID", label: isBn ? "আনপেইড" : "Unpaid" },
          ]}
        />
        <FloatingSelect
          label={isBn ? "পেমেন্ট পদ্ধতি" : "Payment Method"}
          value={paymentMethod}
          onChange={setPaymentMethod}
          showClearButton={!!paymentMethod}
          onClear={() => setPaymentMethod("")}
          options={[
            { value: "COD", label: isBn ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery" },
            { value: "ONLINE", label: isBn ? "অনলাইন" : "Online" },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <FloatingDatePicker label={isBn ? "শুরু তারিখ" : "From"} value={from} onChange={setFrom} clearable />
          <FloatingDatePicker label={isBn ? "শেষ তারিখ" : "To"} value={to} onChange={setTo} clearable />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton columns={8} rows={8} />
      ) : rows.length === 0 ? (
        <p className="text-gray-400 text-sm">{isBn ? "কোনো তথ্য নেই" : "No data found"}</p>
      ) : (
        <div className="card p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "তারিখ" : "Date"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "অর্ডার নম্বর" : "Order Number"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "গ্রাহক" : "Customer"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "পেমেন্ট" : "Payment"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{t("order.status")}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "আইটেম" : "Items"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "ডিসকাউন্ট" : "Discount"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "সর্বমোট" : "Total"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(r.date, locale)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.order_number}</td>
                  <td className="px-4 py-3 text-gray-800">
                    <div className="text-sm">{r.customer_name || "—"}</div>
                    <div className="text-[10px] text-gray-400">{r.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>{r.payment_method === "COD" ? "💵" : "💳"}</span>
                        <span>{r.payment_method === "COD" ? "COD" : (isBn ? "অনলাইন" : "Online")}</span>
                      </div>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${r.payment_status === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {r.payment_status === "PAID" ? (isBn ? "পেইড" : "Paid") : (isBn ? "আনপেইড" : "Unpaid")}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={r.status as OrderStatus} locale={locale} />
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-700">{r.items_count}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-600">{formatAmount(r.discount_amount, locale, 2)}</td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-amber-700">{formatAmount(r.grand_total, locale, 2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-amber-200 bg-amber-50">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-xs font-bold text-gray-700">
                  {isBn ? "সর্বমোট" : "Total"} ({data?.total_orders ?? 0} {isBn ? "টি অর্ডার" : "orders"})
                </td>
                <td></td>
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

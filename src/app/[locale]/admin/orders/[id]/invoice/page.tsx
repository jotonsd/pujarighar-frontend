"use client";

import { useGetOrderQuery } from "@/api/orders/ordersApi";
import { OrderDetailSkeleton } from "@/components/ui/skeletons";
import { formatAmount, formatNumber } from "@/utils/format";
import { Printer } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export default function InvoicePage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const isBn   = locale === "bn";
  const router = useRouter();

  const { data: order, isLoading } = useGetOrderQuery(params.id);

  if (isLoading || !order) return <OrderDetailSkeleton />;

  const customerName = isBn ? order.shipping_name_bn : order.shipping_name_en;
  const address      = isBn ? order.shipping_address_bn : order.shipping_address_en;
  const invoiceDate  = new Date(order.created_at).toLocaleDateString(
    isBn ? "bn-BD" : "en-US",
    { day: "numeric", month: "long", year: "numeric" },
  );

  const hasDiscount = parseFloat(order.discount_amount) > 0;
  const hasTax      = parseFloat(order.tax_amount) > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Toolbar — hidden on print */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <button onClick={() => router.back()} className="btn-secondary text-sm">
          ← {isBn ? "ফিরে যান" : "Back"}
        </button>
        <button onClick={() => window.print()} className="btn-primary text-sm flex items-center gap-2">
          <Printer className="w-4 h-4" />
          {isBn ? "প্রিন্ট / PDF" : "Print / PDF"}
        </button>
      </div>

      {/* Invoice card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 print:shadow-none print:border-none print:rounded-none print:p-0">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-amber-600">পূজারিঘর</h1>
            <p className="text-xs text-gray-400 mt-1">pujarighar.com</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-800">{isBn ? "চালান" : "Invoice"}</p>
            <p className="text-sm font-mono text-gray-500 mt-1">{order.order_number}</p>
            <p className="text-xs text-gray-400 mt-0.5">{isBn ? "তারিখ:" : "Date:"} {invoiceDate}</p>
          </div>
        </div>

        {/* Customer info */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {isBn ? "প্রেরণ করা হচ্ছে" : "Bill To"}
          </p>
          <p className="font-semibold text-gray-800">{customerName}</p>
          <p className="text-sm text-gray-500">{order.shipping_phone}</p>
          {address && <p className="text-sm text-gray-500">{address}</p>}
          {order.shipping_district && (
            <p className="text-sm text-gray-500">
              {order.shipping_district}
              {order.shipping_thana && `, ${order.shipping_thana}`}
              {order.shipping_post_code && ` — ${order.shipping_post_code}`}
            </p>
          )}
        </div>

        {/* Items table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
              <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {isBn ? "পণ্য" : "Item"}
              </th>
              <th className="text-right pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                {isBn ? "পরিমাণ" : "Qty"}
              </th>
              <th className="text-right pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                {isBn ? "একক মূল্য" : "Unit Price"}
              </th>
              <th className="text-right pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                {isBn ? "মোট" : "Total"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map((item, i) => (
              <tr key={item.id}>
                <td className="py-3 text-gray-400 text-xs">{i + 1}</td>
                <td className="py-3">
                  <p className="font-medium text-gray-800">
                    {item.is_package && <span className="text-xs text-amber-600 mr-1">[{isBn ? "প্যাকেজ" : "Pkg"}]</span>}
                    {isBn ? item.product_name_bn : item.product_name_en}
                  </p>
                </td>
                <td className="py-3 text-right text-gray-600">
                  {formatNumber(Math.round(parseFloat(item.quantity)), locale)}
                </td>
                <td className="py-3 text-right text-gray-600">
                  {formatAmount(item.unit_price, locale)}
                </td>
                <td className="py-3 text-right font-medium text-gray-800">
                  {formatAmount(item.line_total, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{isBn ? "সাবটোটাল" : "Subtotal"}</span>
              <span>{formatAmount(order.subtotal, locale)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between text-sm text-green-600">
                <span>{isBn ? "ছাড়" : "Discount"}</span>
                <span>− {formatAmount(order.discount_amount, locale)}</span>
              </div>
            )}
            {hasTax && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>{isBn ? "কর" : "Tax"}</span>
                <span>{formatAmount(order.tax_amount, locale)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-800 border-t border-gray-200 pt-2">
              <span>{isBn ? "সর্বমোট" : "Grand Total"}</span>
              <span className="text-amber-600">{formatAmount(order.grand_total, locale)}</span>
            </div>
          </div>
        </div>

        {/* Payment info */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-400">{isBn ? "পেমেন্ট পদ্ধতি:" : "Payment Method:"}</span>{" "}
            <span className="font-medium text-gray-700">
              {order.payment_method === "COD"
                ? (isBn ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery")
                : (isBn ? "অনলাইন পেমেন্ট" : "Online Payment")}
            </span>
          </div>
          <div>
            <span className="text-gray-400">{isBn ? "পেমেন্ট অবস্থা:" : "Payment Status:"}</span>{" "}
            <span className={`font-semibold ${order.payment_status === "PAID" ? "text-green-600" : "text-amber-600"}`}>
              {order.payment_status === "PAID"
                ? (isBn ? "পরিশোধিত" : "Paid")
                : (isBn ? "অপরিশোধিত" : "Unpaid")}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-300">
          {isBn ? "ধন্যবাদ আপনার ক্রয়ের জন্য • পূজারিঘর" : "Thank you for your purchase • PujariGhar"}
        </div>
      </div>

      {/* Print-only page break styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
}

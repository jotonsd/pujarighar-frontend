"use client";

import { useTrackByOrderNumberQuery } from "@/api/orders/ordersApi";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import StatusTimeline from "@/components/orders/StatusTimeline";
import { FloatingInput } from "@/components/ui/forms";
import Spinner from "@/components/ui/Spinner";
import { formatAmount, localName } from "@/utils/format";
import { useLocale } from "next-intl";
import { useState } from "react";

export default function TrackOrderPage() {
  const locale = useLocale();

  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [query, setQuery] = useState<{
    order_number: string;
    phone: string;
  } | null>(null);

  const {
    data: order,
    isLoading,
    isError,
  } = useTrackByOrderNumberQuery(query ?? { order_number: "", phone: "" }, {
    skip: !query,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;
    setQuery({
      order_number: orderNumber.trim().toUpperCase(),
      phone: phone.trim(),
    });
  };

  const isBn = locale === "bn";

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      {/* Search form */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📦</span>
          <h1 className="text-xl font-bold text-gray-800">
            {isBn ? "অর্ডার ট্র্যাক করুন" : "Track Your Order"}
          </h1>
        </div>
        <p className="text-sm text-gray-500">
          {isBn
            ? "আপনার অর্ডার নম্বর ও ফোন নম্বর দিয়ে অর্ডারের বর্তমান অবস্থা জানুন।"
            : "Enter your order number and phone number to check the status of your order."}
        </p>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FloatingInput
              label={isBn ? "অর্ডার নম্বর *" : "Order Number *"}
              required
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder="PG-20260603-0001"
            />
            <FloatingInput
              label={isBn ? "ফোন নম্বর *" : "Phone Number *"}
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading
              ? isBn
                ? "খুঁজছি..."
                : "Searching..."
              : isBn
                ? "অর্ডার খুঁজুন"
                : "Search Order"}
          </button>
        </form>
      </div>

      {/* Loading */}
      {isLoading && <Spinner />}

      {/* Not found */}
      {!isLoading && isError && query && (
        <div className="card text-center py-8 space-y-2">
          <p className="text-3xl">🔍</p>
          <p className="font-semibold text-gray-700">
            {isBn ? "অর্ডার পাওয়া যায়নি" : "Order not found"}
          </p>
          <p className="text-sm text-gray-400">
            {isBn
              ? "অর্ডার নম্বর বা ফোন নম্বর সঠিক কিনা যাচাই করুন।"
              : "Please check your order number and phone number."}
          </p>
        </div>
      )}

      {/* Result */}
      {order && (
        <div className="card space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                {isBn ? "অর্ডার নম্বর" : "Order Number"}
              </p>
              <h2 className="text-lg font-bold text-gray-800">
                {order.order_number}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {new Date(order.created_at).toLocaleDateString(
                  isBn ? "bn-BD" : "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </p>
            </div>
            <OrderStatusBadge status={order.status} locale={locale} />
          </div>

          {/* Shipping info */}
          <div className="border-t border-gray-100 pt-4 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {isBn ? "ডেলিভারি তথ্য" : "Delivery Info"}
            </p>
            <p className="text-sm font-medium text-gray-700">
              {localName(order.shipping_name_bn, order.shipping_name_en, isBn)}
            </p>
            <p className="text-sm text-gray-500">{order.shipping_phone}</p>
            <p className="text-sm text-gray-500">{order.shipping_address_bn}</p>
            {order.shipping_district && (
              <p className="text-sm text-gray-400">
                {order.shipping_district}
                {order.shipping_thana ? `, ${order.shipping_thana}` : ""}
              </p>
            )}
          </div>

          {/* Payment + total */}
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">
                {isBn
                  ? order.payment_method_label_bn
                  : order.payment_method_label_en}
              </span>
              {" · "}
              <span
                className={
                  order.payment_status === "PAID"
                    ? "text-green-600"
                    : "text-amber-600"
                }
              >
                {order.payment_status === "PAID"
                  ? isBn
                    ? "পেইড"
                    : "Paid"
                  : isBn
                    ? "আনপেইড"
                    : "Unpaid"}
              </span>
            </div>
            <p className="font-bold text-amber-600 text-lg">
              {formatAmount(order.grand_total, locale)}
            </p>
          </div>

          {/* Timeline */}
          {order.timeline.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                {isBn ? "অর্ডারের অগ্রগতি" : "Order Progress"}
              </p>
              <StatusTimeline
                logs={order.timeline}
                locale={locale}
                deliveryInfo={order.delivery_info}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

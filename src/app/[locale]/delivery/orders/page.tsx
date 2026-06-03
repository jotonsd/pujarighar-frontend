"use client";

import { useGetOrdersQuery } from "@/api/orders/ordersApi";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import Spinner from "@/components/ui/Spinner";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useState } from "react";

const STATUS_FILTERS = [
  { value: "ASSIGNED", label_bn: "নির্ধারিত", label_en: "Assigned" },
  { value: "ON_THE_WAY", label_bn: "পথে আছে", label_en: "On the Way" },
  { value: "DELIVERED", label_bn: "ডেলিভারি হয়েছে", label_en: "Delivered" },
  { value: "RETURNED", label_bn: "ফেরত", label_en: "Returned" },
  { value: "", label_bn: "সব", label_en: "All" },
];

export default function DeliveryOrdersPage() {
  const locale = useLocale();
  const [status, setStatus] = useState("ASSIGNED");

  const { data, isLoading } = useGetOrdersQuery({ status });

  return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {locale === "bn" ? "আমার ডেলিভারি" : "My Deliveries"}
      </h1>

      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              status === f.value
                ? "bg-amber-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-amber-300"
            }`}
          >
            {locale === "bn" ? f.label_bn : f.label_en}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data?.data?.length ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p>{locale === "bn" ? "কোনো ডেলিভারি নেই" : "No deliveries found"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.data.map(order => (
            <Link
              key={order.id}
              href={`/${locale}/delivery/orders/${order.id}`}
              className="card flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <p className="font-semibold text-gray-800">
                  {order.order_number}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {locale === "bn"
                    ? order.shipping_name_bn
                    : order.shipping_name_en}
                  {" · "}
                  {order.shipping_phone}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {order.shipping_district && `${order.shipping_district}, `}
                  {order.shipping_thana}
                </p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <OrderStatusBadge status={order.status} locale={locale} />
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(order.created_at).toLocaleDateString(
                    locale === "bn" ? "bn-BD" : "en-US",
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

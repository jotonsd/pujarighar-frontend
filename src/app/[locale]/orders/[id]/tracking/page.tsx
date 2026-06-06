"use client";

import { useGetOrderTrackingQuery } from "@/api/orders/ordersApi";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import StatusTimeline from "@/components/orders/StatusTimeline";
import Spinner from "@/components/ui/Spinner";
import { localName } from "@/utils/format";
import { useLocale } from "next-intl";

export default function TrackingPage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const isBn = locale === "bn";
  const { data: order, isLoading } = useGetOrderTrackingQuery(params.id);

  if (isLoading) return <Spinner />;
  if (!order)
    return (
      <p className="text-center py-16 text-gray-400">
        {isBn ? "অর্ডার পাওয়া যায়নি" : "Order not found"}
      </p>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <div className="card max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {order.order_number}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
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

        {/* Customer */}
        <div className="border-t border-gray-100 pt-4 space-y-0.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            {isBn ? "গ্রাহকের তথ্য" : "Customer"}
          </p>
          <p className="text-sm font-medium text-gray-700">
            {localName(order.shipping_name_bn, order.shipping_name_en, isBn)}
          </p>
          <p className="text-sm text-gray-500">{order.shipping_phone}</p>
        </div>

        {/* Timeline — delivery info shown inline on ASSIGNED entry */}
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
    </div>
  );
}

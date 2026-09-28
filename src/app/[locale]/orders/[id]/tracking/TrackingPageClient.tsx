"use client";

import { useGetOrderTrackingQuery } from "@/api/orders/ordersApi";
import OrderProgressBar from "@/components/orders/OrderProgressBar";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import StatusTimeline from "@/components/orders/StatusTimeline";
import { TrackingSkeleton } from "@/components/ui/skeletons";
import { localName } from "@/utils/format";
import { useLocale } from "next-intl";
import { ReactNode } from "react";

export default function TrackingPageClient({ id, offerBanners }: { id: string; offerBanners?: ReactNode }) {
  const locale = useLocale();
  const isBn = locale === "bn";
  const { data: order, isLoading } = useGetOrderTrackingQuery(id);

  if (isLoading)
    return (
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="max-w-2xl mx-auto mb-4">{offerBanners}</div>
        <div className="max-w-2xl mx-auto">
          <TrackingSkeleton />
        </div>
      </div>
    );
  if (!order)
    return (
      <p className="text-center py-16 text-muted">
        {isBn ? "অর্ডার পাওয়া যায়নি" : "Order not found"}
      </p>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <div className="max-w-2xl mx-auto mb-4">
        {offerBanners}
      </div>
      <div className="card max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-body">
              {order.order_number}
            </h1>
            <p className="text-muted text-sm mt-0.5">
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

        <OrderProgressBar status={order.status} locale={locale} isCourier={order.is_courier} />

        {order.exchanged_to && (
          <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30 px-4 py-3 text-sm text-purple-800 dark:text-purple-300">
            {isBn
              ? "এই অর্ডারটি বিনিময় করা হয়েছে। আপনার নতুন অর্ডারের অবস্থা দেখুন: "
              : "This order was exchanged. Track your replacement order: "}
            <a href={`/${locale}/orders/${order.exchanged_to.id}/tracking`} className="font-semibold underline">
              #{order.exchanged_to.order_number}
            </a>
          </div>
        )}

        {/* Customer */}
        <div className="border-t border-border pt-4 space-y-0.5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
            {isBn ? "ডেলিভারি তথ্য" : "Delivery Info"}
          </p>
          <p className="text-sm font-medium text-muted">
            {localName(order.shipping_name_bn, order.shipping_name_en, isBn)}
          </p>
          <p className="text-sm text-muted">{order.shipping_phone}</p>
          <p className="text-sm text-muted">{order.shipping_address_bn}</p>
          {order.shipping_district && (
            <p className="text-sm text-muted">
              {order.shipping_district}
              {order.shipping_thana ? `, ${order.shipping_thana}` : ""}
            </p>
          )}
        </div>

        {/* Timeline — delivery info shown inline on ASSIGNED entry */}
        {order.timeline.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">
              {isBn ? "অর্ডারের অগ্রগতি" : "Order Progress"}
            </p>
            <StatusTimeline
              logs={order.timeline}
              locale={locale}
              deliveryInfo={order.delivery_info}
              courierTrackingUrl={order.courier_tracking_url}
            />
          </div>
        )}
      </div>
    </div>
  );
}

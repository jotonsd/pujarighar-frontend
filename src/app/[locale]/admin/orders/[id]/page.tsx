"use client";

import { useGetOrderQuery, useGetOrderStatusLogQuery } from "@/api/orders/ordersApi";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import StatusTimeline from "@/components/orders/StatusTimeline";
import OrderActions from "@/components/admin/orders/OrderActions";
import OrderItems from "@/components/admin/orders/OrderItems";
import OrderShipping from "@/components/admin/orders/OrderShipping";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLocale } from "next-intl";

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const { data: order, isLoading } = useGetOrderQuery(params.id);
  const { data: logs = [] }        = useGetOrderStatusLogQuery(params.id);

  if (isLoading || !order) return (
    <div className="max-w-7xl space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={order.order_number}
        description={`${locale === "bn" ? order.shipping_name_bn : order.shipping_name_en} · ${order.shipping_phone}`}
        showBack backHref={`/${locale}/admin/orders`}
        backLabel={locale === "bn" ? "অর্ডার তালিকা" : "Orders"}
        actions={<OrderStatusBadge status={order.status} locale={locale} />} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <OrderItems order={order} />
          <OrderShipping order={order} />
          <OrderActions order={order} orderId={params.id} />
        </div>
        <div className="card h-fit">
          <h2 className="font-semibold text-gray-700 mb-4">
            {locale === "bn" ? "ট্র্যাকিং" : "Tracking"}
          </h2>
          <StatusTimeline logs={logs} locale={locale}
            deliveryInfo={order.delivery ? {
              name_bn:      order.delivery.delivery_person_name_bn,
              name_en:      order.delivery.delivery_person_name_en,
              phone:        order.delivery.delivery_person_phone,
              assigned_at:  order.delivery.assigned_at,
              picked_up_at: order.delivery.picked_up_at,
              delivered_at: order.delivery.delivered_at,
            } : null} />
        </div>
      </div>
    </div>
  );
}

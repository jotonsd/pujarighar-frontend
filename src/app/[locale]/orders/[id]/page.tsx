"use client";
import { formatAmount, formatNumber } from "@/utils/format";

import {
  useCancelOrderMutation,
  useGetOrderQuery,
  useGetOrderStatusLogQuery,
} from "@/api/orders/ordersApi";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import StatusTimeline from "@/components/orders/StatusTimeline";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

function CancelConfirmModal({
  locale,
  orderNumber,
  onConfirm,
  onCancel,
  loading,
}: {
  locale: string;
  orderNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isBn = locale === "bn";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-lg font-bold text-gray-800">
            {isBn ? "অর্ডার বাতিল করবেন?" : "Cancel this order?"}
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          {isBn ? `অর্ডার নম্বর ` : `Order `}
          <strong className="text-gray-700">{orderNumber}</strong>
          {isBn
            ? ` বাতিল করা হবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।`
            : ` will be cancelled. This cannot be undone.`}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {loading
              ? isBn
                ? "বাতিল হচ্ছে..."
                : "Cancelling..."
              : isBn
                ? "হ্যাঁ, বাতিল করুন"
                : "Yes, Cancel"}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 btn-secondary"
          >
            {isBn ? "ফিরে যান" : "Go Back"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore(s => s.user);

  const { data: order, isLoading } = useGetOrderQuery(params.id);
  const { data: logs = [] } = useGetOrderStatusLogQuery(params.id);
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();

  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleCancel = async () => {
    try {
      await cancelOrder({ id: params.id }).unwrap();
      setShowCancelModal(false);
      toast.success(
        locale === "bn" ? "অর্ডার বাতিল হয়েছে" : "Order cancelled",
      );
    } catch {
      toast.error(
        locale === "bn" ? "বাতিল ব্যর্থ হয়েছে" : "Cancellation failed",
      );
    }
  };

  if (isLoading) return <Spinner />;
  if (!order) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      <PageHeader
        title={order.order_number}
        description={new Date(order.created_at).toLocaleString(
          locale === "bn" ? "bn-BD" : "en-US",
        )}
        showBack
        backLabel={t("common.back")}
        actions={<OrderStatusBadge status={order.status} locale={locale} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-4">
              {t("order.items")}
            </h2>
            <div className="space-y-3">
              {order.items.map(item => (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 flex items-center gap-1.5">
                      {item.is_package && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                          🎁
                        </span>
                      )}
                      {locale === "bn"
                        ? item.product_name_bn
                        : item.product_name_en}
                      <span className="text-gray-400 ml-1">
                        ×
                        {formatNumber(
                          Math.round(parseFloat(item.quantity)),
                          locale,
                        )}
                      </span>
                    </span>
                    <span className="font-medium">
                      {formatAmount(item.line_total, locale)}
                    </span>
                  </div>
                  {item.is_package && item.package_items?.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {item.package_items.map((pi, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-gray-500"
                        >
                          <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                          {locale === "bn"
                            ? pi.component_name_bn
                            : pi.component_name_en}
                          <span className="text-gray-400">
                            ×
                            {formatNumber(
                              Math.round(parseFloat(pi.quantity)),
                              locale,
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <hr className="my-2" />
              <div className="flex justify-between font-bold">
                <span>{t("order.total")}</span>
                <span className="text-amber-600">
                  {formatAmount(order.grand_total, locale)}
                </span>
              </div>
            </div>
          </div>
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-3">
              {t("order.shipping")}
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                {locale === "bn"
                  ? order.shipping_name_bn
                  : order.shipping_name_en}
              </p>
              <p>{order.shipping_phone}</p>
              <p>
                {locale === "bn"
                  ? order.shipping_address_bn
                  : order.shipping_address_en}
              </p>
              {order.shipping_district && (
                <p>
                  {order.shipping_district}, {order.shipping_thana} -{" "}
                  {order.shipping_post_code}
                </p>
              )}
            </div>
          </div>
          {user?.role === "CUSTOMER" && order.status === "PENDING" && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn-secondary"
            >
              {t("order.cancel")}
            </button>
          )}
          {showCancelModal && (
            <CancelConfirmModal
              locale={locale}
              orderNumber={order.order_number}
              onConfirm={handleCancel}
              onCancel={() => setShowCancelModal(false)}
              loading={cancelling}
            />
          )}
        </div>
        <div className="card h-fit">
          <h2 className="font-semibold text-gray-700 mb-4">
            {t("order.tracking")}
          </h2>
          <StatusTimeline
            logs={logs}
            locale={locale}
            deliveryInfo={
              order.delivery
                ? {
                    name_bn: order.delivery.delivery_person_name_bn,
                    name_en: order.delivery.delivery_person_name_en,
                    phone: order.delivery.delivery_person_phone,
                    assigned_at: order.delivery.assigned_at,
                    picked_up_at: order.delivery.picked_up_at,
                    delivered_at: order.delivery.delivered_at,
                  }
                : null
            }
          />
          <p className="text-xs text-gray-400 text-center mt-2">
            <a
              href={`/${locale}/orders/${order.id}/tracking`}
              className="text-amber-600 hover:underline"
            >
              {locale === "bn"
                ? "পাবলিক ট্র্যাকিং লিংক"
                : "Public tracking link"}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

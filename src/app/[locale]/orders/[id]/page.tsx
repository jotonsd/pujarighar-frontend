"use client";
import { formatAmount, formatNumber } from "@/utils/format";

import {
    useCancelOrderMutation,
    useGetOrderQuery,
    useGetOrderStatusLogQuery,
} from "@/api/orders/ordersApi";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import StatusTimeline from "@/components/orders/StatusTimeline";
import Spinner from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

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

  const handleCancel = async () => {
    if (!confirm(t("common.confirm"))) return;
    try {
      await cancelOrder({ id: params.id }).unwrap();
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
      <button
        onClick={() => router.back()}
        className="text-amber-600 hover:underline mb-6 text-sm"
      >
        ← {t("common.back")}
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {order.order_number}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date(order.created_at).toLocaleString(
              locale === "bn" ? "bn-BD" : "en-US",
            )}
          </p>
        </div>
        <OrderStatusBadge status={order.status} locale={locale} />
      </div>

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
              onClick={handleCancel}
              disabled={cancelling}
              className="btn-secondary"
            >
              {cancelling ? t("common.loading") : t("order.cancel")}
            </button>
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

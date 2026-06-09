"use client";
import { formatAmount, formatNumber, localName } from "@/utils/format";

import {
  useDeliverOrderMutation,
  useDispatchOrderMutation,
  useGetOrderQuery,
  useGetOrderStatusLogQuery,
  useMarkCodPaidMutation,
  useReturnOrderMutation,
} from "@/api/orders/ordersApi";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import StatusTimeline from "@/components/orders/StatusTimeline";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import PaymentConfirmModal from "@/components/ui/PaymentConfirmModal";
import { DeliveryOrderDetailSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/store/toastStore";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeliveryOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const locale = useLocale();
  const router = useRouter();

  const { data: order, isLoading } = useGetOrderQuery(params.id);
  const { data: logs = [] } = useGetOrderStatusLogQuery(params.id);

  const [dispatch, { isLoading: dispatching }] = useDispatchOrderMutation();
  const [deliver, { isLoading: delivering }] = useDeliverOrderMutation();
  const [returnOrd, { isLoading: returning }] = useReturnOrderMutation();
  const [markPaid, { isLoading: markingPaid }] = useMarkCodPaidMutation();

  const [showPayModal, setShowPayModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const isPending = dispatching || delivering || returning || markingPaid;
  const loading = locale === "bn" ? "লোড হচ্ছে..." : "Loading...";

  const doAction = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast.success(msg);
    } catch {
      toast.error(locale === "bn" ? "ব্যর্থ হয়েছে" : "Action failed");
    }
  };

  if (isLoading) return <DeliveryOrderDetailSkeleton />;
  if (!order) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <PageHeader
        title={order.order_number}
        description={new Date(order.created_at).toLocaleString(
          locale === "bn" ? "bn-BD" : "en-US",
        )}
        showBack
        backHref={`/${locale}/delivery/orders`}
        backLabel={locale === "bn" ? "আমার ডেলিভারি" : "My Deliveries"}
        actions={<OrderStatusBadge status={order.status} locale={locale} />}
      />

      <div className="flex gap-3 mb-3">
        {order.status === "ASSIGNED" && (
          <button
            onClick={() =>
              doAction(
                () => dispatch(params.id).unwrap(),
                locale === "bn"
                  ? "পণ্য নিয়ে বের হয়েছেন"
                  : "Marked as On the Way",
              )
            }
            disabled={isPending}
            className="btn-primary flex-1"
          >
            {isPending
              ? loading
              : locale === "bn"
                ? "🚴 পথে বের হচ্ছি"
                : "🚴 Start Delivery"}
          </button>
        )}
        {order.status === "ON_THE_WAY" && (
          <button
            onClick={() =>
              doAction(
                () => deliver(params.id).unwrap(),
                locale === "bn" ? "ডেলিভারি সম্পন্ন" : "Marked as Delivered",
              )
            }
            disabled={isPending}
            className="btn-primary flex-1"
          >
            {isPending
              ? loading
              : locale === "bn"
                ? "✅ ডেলিভারি সম্পন্ন"
                : "✅ Mark as Delivered"}
          </button>
        )}
        {(order.status === "ON_THE_WAY" || order.status === "DELIVERED") &&
          order.payment_method === "COD" &&
          order.payment_status === "UNPAID" && (
            <button
              onClick={() => setShowPayModal(true)}
              disabled={isPending}
              className="flex-1 py-2 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
            >
              {locale === "bn" ? "💵 পেমেন্ট নিশ্চিত করুন" : "💵 Mark as Paid"}
            </button>
          )}
        {order.status === "DELIVERED" && (
          <button
            onClick={() => setShowReturnModal(true)}
            disabled={isPending}
            className="flex-1 py-2 px-4 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 font-medium transition-colors"
          >
            {isPending
              ? loading
              : locale === "bn"
                ? "↩ ফেরত"
                : "↩ Mark as Returned"}
          </button>
        )}
      </div>

      {showReturnModal && (
        <ConfirmModal
          icon="↩"
          title={locale === "bn" ? "ফেরত নিশ্চিত করুন?" : "Confirm return?"}
          description={locale === "bn" ? "এই অর্ডারটি ফেরত হিসেবে চিহ্নিত হবে।" : "This order will be marked as returned."}
          confirmLabel={locale === "bn" ? "হ্যাঁ, ফেরত দিন" : "Yes, Return"}
          cancelLabel={locale === "bn" ? "বাতিল" : "Cancel"}
          confirmClassName="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          loading={returning}
          onCancel={() => setShowReturnModal(false)}
          onConfirm={async () => {
            await doAction(
              () => returnOrd({ id: params.id }).unwrap(),
              locale === "bn" ? "ফেরত দেওয়া হয়েছে" : "Marked as Returned",
            );
            setShowReturnModal(false);
          }}
        />
      )}

      {showPayModal && order && (
        <PaymentConfirmModal
          locale={locale}
          orderNumber={order.order_number}
          amount={formatAmount(order.grand_total, locale, 0)}
          loading={markingPaid}
          onCancel={() => setShowPayModal(false)}
          onConfirm={async () => {
            await doAction(
              () => markPaid(params.id).unwrap(),
              locale === "bn" ? "পেমেন্ট নিশ্চিত হয়েছে" : "Payment confirmed",
            );
            setShowPayModal(false);
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-3">
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-3">
            {locale === "bn" ? "ডেলিভারি ঠিকানা" : "Delivery Address"}
          </h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-800">
              {localName(
                order.shipping_name_bn,
                order.shipping_name_en,
                locale === "bn",
              )}
            </p>
            <p>{order.shipping_phone}</p>
            <p>
              {locale === "bn"
                ? order.shipping_address_bn
                : order.shipping_address_en}
            </p>
            {(order.shipping_district || order.shipping_thana) && (
              <p>
                {[
                  order.shipping_district,
                  order.shipping_thana,
                  order.shipping_post_code,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        </div>
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-3">
            {locale === "bn" ? "পণ্য" : "Items"}
          </h2>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 flex items-center gap-1.5">
                    {item.is_package && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                        🎁 {locale === "bn" ? "প্যাকেজ" : "Pkg"}
                      </span>
                    )}
                    {localName(
                      item.product_name_bn,
                      item.product_name_en,
                      locale === "bn",
                    )}
                    <span className="text-gray-400">
                      ×
                      {formatNumber(
                        Math.round(parseFloat(String(item.quantity))),
                        locale,
                      )}
                    </span>
                  </span>
                  <span className="font-bold">
                    {formatAmount(item.line_total, locale)}
                  </span>
                </div>
                {item.is_package && item.package_items?.length > 0 && (
                  <div className="ml-4 mt-1 pl-3 border-l-2 border-amber-100 space-y-0.5">
                    {item.package_items.map((pi, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs text-gray-500"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-amber-300 shrink-0" />
                          {localName(
                            pi.component_name_bn,
                            pi.component_name_en,
                            locale === "bn",
                          )}
                        </span>
                        <span className="text-gray-400 font-bold">
                          ×
                          {formatNumber(
                            Math.round(
                              Number(pi.quantity) * Number(item.quantity),
                            ),
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
            <div className="flex justify-between font-bold text-sm">
              <span>{locale === "bn" ? "মোট" : "Total"}</span>
              <span className="text-amber-600">
                {formatAmount(order.grand_total, locale)}
              </span>
            </div>
          </div>
        </div>
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">
            {locale === "bn" ? "স্ট্যাটাস ইতিহাস" : "Status History"}
          </h2>
          {logs.length > 0 ? (
            <StatusTimeline logs={logs} locale={locale} />
          ) : (
            <p className="text-sm text-gray-400">
              {locale === "bn" ? "কোনো ইতিহাস নেই" : "No history yet"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

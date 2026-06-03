"use client";
import { formatAmount } from "@/utils/format";

import {
    useDeliverOrderMutation,
    useDispatchOrderMutation,
    useGetOrderQuery,
    useGetOrderStatusLogQuery,
    useReturnOrderMutation,
} from "@/api/orders/ordersApi";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import StatusTimeline from "@/components/orders/StatusTimeline";
import Spinner from "@/components/ui/Spinner";
import { toast } from "@/store/toastStore";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

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

  const isPending = dispatching || delivering || returning;
  const loading = locale === "bn" ? "লোড হচ্ছে..." : "Loading...";

  const doAction = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast.success(msg);
    } catch {
      toast.error(locale === "bn" ? "ব্যর্থ হয়েছে" : "Action failed");
    }
  };

  if (isLoading) return <Spinner />;
  if (!order) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      <button
        onClick={() => router.back()}
        className="text-amber-600 hover:underline mb-6 text-sm block"
      >
        ← {locale === "bn" ? "ফিরে যান" : "Back"}
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
          className="btn-primary w-full mb-6"
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
          className="btn-primary w-full mb-6"
        >
          {isPending
            ? loading
            : locale === "bn"
              ? "✅ ডেলিভারি সম্পন্ন"
              : "✅ Mark as Delivered"}
        </button>
      )}
      {order.status === "DELIVERED" && (
        <button
          onClick={() => {
            if (
              confirm(
                locale === "bn" ? "ফেরত নিশ্চিত করুন?" : "Confirm return?",
              )
            )
              doAction(
                () => returnOrd({ id: params.id }).unwrap(),
                locale === "bn" ? "ফেরত দেওয়া হয়েছে" : "Marked as Returned",
              );
          }}
          disabled={isPending}
          className="w-full py-2 px-4 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 font-medium transition-colors mb-6"
        >
          {isPending
            ? loading
            : locale === "bn"
              ? "↩ ফেরত"
              : "↩ Mark as Returned"}
        </button>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-3">
            {locale === "bn" ? "ডেলিভারি ঠিকানা" : "Delivery Address"}
          </h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-800">
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
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {locale === "bn"
                    ? item.product_name_bn
                    : item.product_name_en}
                  <span className="text-gray-400 ml-2">×{item.quantity}</span>
                </span>
                <span className="font-medium">
                  {formatAmount(item.line_total, locale)}
                </span>
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

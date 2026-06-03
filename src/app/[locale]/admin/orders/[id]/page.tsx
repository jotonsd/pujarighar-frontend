"use client";

import {
  useAssignDeliveryMutation,
  useCancelOrderMutation,
  useConfirmOrderMutation,
  useGetOrderQuery,
  useGetOrderStatusLogQuery,
  usePackOrderMutation,
} from "@/api/orders/ordersApi";
import { useGetDeliveryPersonsQuery } from "@/api/users/usersApi";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import StatusTimeline from "@/components/orders/StatusTimeline";
import { FloatingSelect } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { toast } from "@/store/toastStore";
import { formatAmount, formatNumber } from "@/utils/format";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

function CancelConfirmModal({
  locale, orderNumber, onConfirm, onCancel, loading,
}: {
  locale: string; orderNumber: string
  onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  const isBn = locale === 'bn'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-lg font-bold text-gray-800">
            {isBn ? 'অর্ডার বাতিল করবেন?' : 'Cancel this order?'}
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          {isBn ? 'অর্ডার নম্বর ' : 'Order '}
          <strong className="text-gray-700">{orderNumber}</strong>
          {isBn ? ' বাতিল করা হবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।' : ' will be cancelled. This cannot be undone.'}
        </p>
        <div className="flex gap-3">
          <button onClick={onConfirm} disabled={loading} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
            {loading ? (isBn ? 'বাতিল হচ্ছে...' : 'Cancelling...') : (isBn ? 'হ্যাঁ, বাতিল করুন' : 'Yes, Cancel')}
          </button>
          <button onClick={onCancel} disabled={loading} className="flex-1 btn-secondary">
            {isBn ? 'ফিরে যান' : 'Go Back'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [deliveryPersonId, setDeliveryPersonId] = useState("");
  const [showCancelModal, setShowCancelModal]   = useState(false);

  const { data: order, isLoading } = useGetOrderQuery(params.id);
  const { data: logs = [] } = useGetOrderStatusLogQuery(params.id);
  const { data: deliveryPersons = [] } = useGetDeliveryPersonsQuery();

  const [confirmOrder, { isLoading: confirming }] = useConfirmOrderMutation();
  const [pack, { isLoading: packing }] = usePackOrderMutation();
  const [assign, { isLoading: assigning }] = useAssignDeliveryMutation();
  const [cancel, { isLoading: cancelling }] = useCancelOrderMutation();

  const loading = confirming || packing || assigning || cancelling;

  const doAction = async (fn: () => Promise<unknown>, successMsg: string) => {
    try {
      await fn();
      toast.success(successMsg);
    } catch {
      toast.error(locale === "bn" ? "ব্যর্থ হয়েছে" : "Action failed");
    }
  };

  if (isLoading || !order) return <Spinner />;

  return (
    <div>
      <PageHeader
        title={order.order_number}
        description={`${locale === "bn" ? order.shipping_name_bn : order.shipping_name_en} · ${order.shipping_phone}`}
        showBack
        backHref={`/${locale}/admin/orders`}
        backLabel={locale === "bn" ? "অর্ডার তালিকা" : "Orders"}
        actions={<OrderStatusBadge status={order.status} locale={locale} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
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
                          🎁 {locale === "bn" ? "প্যাকেজ" : "Package"}
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
                    <span className="font-bold">
                      {formatAmount(item.line_total, locale)}
                    </span>
                  </div>
                  {item.is_package && item.package_items?.length > 0 && (
                    <div className="ml-4 pl-3 border-l-2 border-amber-100 space-y-1">
                      {item.package_items.map((pi, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs text-gray-500"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-amber-300 shrink-0" />
                            {locale === "bn"
                              ? pi.component_name_bn
                              : pi.component_name_en}
                            <span className="text-gray-400 font-mono">
                              {pi.component_sku}
                            </span>
                          </span>
                          <span className="text-gray-400 shrink-0">
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

          {/* Shipping */}
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-4">
              {t("order.shipping")}
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{locale === "bn" ? "নাম" : "Name"}</p>
                <p className="font-medium text-gray-800">{locale === "bn" ? order.shipping_name_bn : order.shipping_name_en}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{locale === "bn" ? "ফোন" : "Phone"}</p>
                <p className="font-medium text-gray-800">{order.shipping_phone}</p>
              </div>
              {(order.shipping_address_bn || order.shipping_address_en) && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">{locale === "bn" ? "ঠিকানা" : "Address"}</p>
                  <p className="font-medium text-gray-800">{locale === "bn" ? order.shipping_address_bn : order.shipping_address_en}</p>
                </div>
              )}
              {order.shipping_district && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">{locale === "bn" ? "জেলা / থানা / পোস্ট কোড" : "District / Thana / Post Code"}</p>
                  <p className="font-medium text-gray-800">{order.shipping_district}, {order.shipping_thana} — {order.shipping_post_code}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-700">
              {locale === "bn" ? "অ্যাকশন" : "Actions"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {order.status === "PENDING" && (
                <button
                  disabled={loading}
                  onClick={() =>
                    doAction(
                      () => confirmOrder(params.id).unwrap(),
                      locale === "bn" ? "নিশ্চিত হয়েছে" : "Confirmed",
                    )
                  }
                  className="btn-primary text-sm"
                >
                  {t("order.confirm")}
                </button>
              )}
              {order.status === "CONFIRMED" && (
                <button
                  disabled={loading}
                  onClick={() =>
                    doAction(
                      () => pack(params.id).unwrap(),
                      locale === "bn" ? "প্যাক হয়েছে" : "Packed",
                    )
                  }
                  className="btn-primary text-sm"
                >
                  {t("order.pack")}
                </button>
              )}
              {order.status === "PACKED" && (
                <div className="flex gap-2 items-end">
                  <div className="w-56">
                    <FloatingSelect
                      label={
                        locale === "bn" ? "ডেলিভারিম্যান" : "Delivery person"
                      }
                      value={deliveryPersonId}
                      onChange={val => setDeliveryPersonId(val)}
                    >
                      <option value="">
                        {locale === "bn" ? "বেছে নিন" : "Select"}
                      </option>
                      {deliveryPersons.map(dp => (
                        <option key={dp.id} value={dp.id}>
                          {dp.profile?.full_name_bn || dp.email}
                        </option>
                      ))}
                    </FloatingSelect>
                  </div>
                  <button
                    disabled={!deliveryPersonId || loading}
                    onClick={() =>
                      doAction(
                        () =>
                          assign({
                            id: params.id,
                            delivery_person_id: deliveryPersonId,
                          }).unwrap(),
                        locale === "bn" ? "নির্ধারিত হয়েছে" : "Assigned",
                      )
                    }
                    className="btn-primary text-sm whitespace-nowrap"
                  >
                    {t("order.assignDelivery")}
                  </button>
                </div>
              )}
              {!["DELIVERED", "RETURNED", "CANCELLED"].includes(
                order.status,
              ) && (
                <>
                  <button
                    disabled={loading}
                    onClick={() => setShowCancelModal(true)}
                    className="btn-secondary text-sm"
                  >
                    {t("order.cancel")}
                  </button>
                  {showCancelModal && (
                    <CancelConfirmModal
                      locale={locale}
                      orderNumber={order.order_number}
                      onConfirm={async () => {
                        await doAction(
                          () => cancel({ id: params.id }).unwrap(),
                          locale === "bn" ? "বাতিল হয়েছে" : "Cancelled",
                        )
                        setShowCancelModal(false)
                      }}
                      onCancel={() => setShowCancelModal(false)}
                      loading={cancelling}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card h-fit">
          <h2 className="font-semibold text-gray-700 mb-4">
            {t("order.tracking")}
          </h2>
          <StatusTimeline
            logs={logs}
            locale={locale}
            deliveryInfo={order.delivery ? {
              name_bn:      order.delivery.delivery_person_name_bn,
              name_en:      order.delivery.delivery_person_name_en,
              phone:        order.delivery.delivery_person_phone,
              assigned_at:  order.delivery.assigned_at,
              picked_up_at: order.delivery.picked_up_at,
              delivered_at: order.delivery.delivered_at,
            } : null}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  useGetOrderQuery,
  useGetOrderStatusLogQuery,
} from "@/api/orders/ordersApi";
import InvoiceModal from "@/components/admin/orders/InvoiceModal";
import OrderActions from "@/components/admin/orders/OrderActions";
import OrderItems from "@/components/admin/orders/OrderItems";
import OrderShipping from "@/components/admin/orders/OrderShipping";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import StatusTimeline from "@/components/orders/StatusTimeline";
import PageHeader from "@/components/ui/PageHeader";
import { OrderDetailSkeleton } from "@/components/ui/skeletons";
import { localName } from "@/utils/format";
import { Check, Copy, ExternalLink, FileText } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";

export default function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const locale = useLocale();
  const [showInvoice, setShowInvoice] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: order, isLoading } = useGetOrderQuery(params.id);
  const { data: logs = [] } = useGetOrderStatusLogQuery(params.id);

  if (isLoading || !order) return <OrderDetailSkeleton />;

  const publicTrackingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/orders/${order.id}/tracking`
      : "";

  const handleCopyTrackingLink = () => {
    navigator.clipboard.writeText(publicTrackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <PageHeader
        title={order.order_number}
        description={`${localName(order.shipping_name_bn, order.shipping_name_en, locale === "bn")} · ${order.shipping_phone}`}
        showBack
        backHref={`/${locale}/admin/orders`}
        backLabel={locale === "bn" ? "অর্ডার তালিকা" : "Orders"}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInvoice(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              {locale === "bn" ? "চালান" : "Invoice"}
            </button>
            <OrderStatusBadge status={order.status} locale={locale} />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <OrderItems order={order} />
          <OrderShipping order={order} />
          <OrderActions order={order} orderId={params.id} />
        </div>
        <div className="card h-fit">
          <h2 className="font-semibold text-gray-700 mb-4">
            {locale === "bn" ? "ট্র্যাকিং" : "Tracking"}
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
                    avatar: order.delivery.delivery_person_avatar ?? null,
                    assigned_at: order.delivery.assigned_at,
                    picked_up_at: order.delivery.picked_up_at,
                    delivered_at: order.delivery.delivered_at,
                  }
                : null
            }
            courierTrackingUrl={order.courier_consignment?.tracking_url}
          />

          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              {locale === "bn" ? "পাবলিক ট্র্যাকিং লিংক" : "Public tracking link"}
            </p>
            <div className="flex items-center gap-1.5">
              <input
                readOnly
                value={publicTrackingUrl}
                onFocus={e => e.target.select()}
                className="flex-1 min-w-0 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 truncate"
              />
              <button
                onClick={handleCopyTrackingLink}
                title={locale === "bn" ? "কপি করুন" : "Copy"}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={publicTrackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={locale === "bn" ? "খুলুন" : "Open"}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {locale === "bn"
                ? "গ্রাহককে এসএমএস/হোয়াটসঅ্যাপে পাঠানোর জন্য এই লিংকটি কপি করুন — লগইন লাগবে না।"
                : "Copy this link to send the customer via SMS/WhatsApp — no login required."}
            </p>
          </div>
        </div>
      </div>

      {showInvoice && (
        <InvoiceModal
          orderId={params.id}
          orderNumber={order.order_number}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  );
}

"use client";
import { formatAmount } from "@/utils/format";

import { useGetOrdersQuery } from "@/api/orders/ordersApi";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Spinner from "@/components/ui/Spinner";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

export default function OrdersPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetOrdersQuery({ page });

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <PageHeader
        title={t("order.title")}
        description={locale === 'bn' ? 'আপনার সকল অর্ডারের তালিকা ও বর্তমান অবস্থা' : 'View all your orders and their current status'}
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {!data?.data?.length && (
            <p className="text-center text-gray-400 py-12">
              {t("common.noData")}
            </p>
          )}
          <div className="space-y-3">
            {data?.data?.map(order => (
              <Link
                key={order.id}
                href={`/${locale}/orders/${order.id}`}
                className="card flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-gray-800">
                    {order.order_number}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString(
                      locale === "bn" ? "bn-BD" : "en-US",
                    )}
                  </p>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-xs text-gray-400">
                      {order.payment_method === "COD" ? "💵" : "💳"}{" "}
                      {order.payment_method === "COD"
                        ? locale === "bn"
                          ? "ক্যাশ অন ডেলিভারি"
                          : "COD"
                        : locale === "bn"
                          ? "অনলাইন"
                          : "Online"}
                    </span>
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                        order.payment_status === "PAID"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {order.payment_status === "PAID"
                        ? locale === "bn"
                          ? "পেইড"
                          : "Paid"
                        : locale === "bn"
                          ? "আনপেইড"
                          : "Unpaid"}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-amber-600 mb-1">
                    {formatAmount(order.grand_total, locale)}
                  </p>
                  <OrderStatusBadge status={order.status} locale={locale} />
                </div>
              </Link>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={data?.pagination?.total_pages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

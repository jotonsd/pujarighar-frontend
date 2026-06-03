"use client";

import { useGetOrdersQuery } from "@/api/orders/ordersApi";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { FloatingSelect } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import type { Column } from "@/components/ui/ReusableTable";
import { ReusableTable } from "@/components/ui/ReusableTable";
import { OrderStatus, SalesOrder } from "@/lib/types";
import { formatAmount } from "@/utils/format";
import { Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "ASSIGNED",
  "ON_THE_WAY",
  "DELIVERED",
  "RETURNED",
  "CANCELLED",
];

export default function AdminOrdersPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading } = useGetOrdersQuery({ page, status });

  const columns: Column<SalesOrder>[] = [
    {
      header: t("order.number"),
      accessor: o => (
        <span className="font-mono text-sm">{o.order_number}</span>
      ),
      exportValue: o => o.order_number,
    },
    {
      header: locale === "bn" ? "গ্রাহক" : "Customer",
      accessor: o => (
        <div>
          <p className="text-sm font-medium text-gray-800">
            {locale === "bn" ? o.shipping_name_bn : o.shipping_name_en}
          </p>
          <p className="text-xs text-gray-400">{o.shipping_phone}</p>
        </div>
      ),
      exportValue: o => `${o.shipping_name_en} / ${o.shipping_phone}`,
    },
    {
      header: t("order.total"),
      accessor: o => (
        <span className="font-bold text-amber-600">
          {formatAmount(o.grand_total, locale)}
        </span>
      ),
      exportValue: o => o.grand_total,
    },
    {
      header: locale === 'bn' ? 'পেমেন্ট' : 'Payment',
      accessor: o => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>{o.payment_method === 'COD' ? '💵' : '💳'}</span>
            <span>{o.payment_method === 'COD' ? (locale === 'bn' ? 'COD' : 'COD') : (locale === 'bn' ? 'অনলাইন' : 'Online')}</span>
          </div>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
            o.payment_status === 'PAID'
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {o.payment_status === 'PAID'
              ? (locale === 'bn' ? 'পেইড' : 'Paid')
              : (locale === 'bn' ? 'আনপেইড' : 'Unpaid')}
          </span>
        </div>
      ),
      exportValue: o => `${o.payment_method} / ${o.payment_status}`,
    },
    {
      header: t("order.status"),
      accessor: o => <OrderStatusBadge status={o.status} locale={locale} />,
      exportValue: o => o.status,
    },
    {
      header: "Date",
      accessor: o => (
        <span className="text-xs text-gray-500">
          {new Date(o.created_at).toLocaleDateString(
            locale === "bn" ? "bn-BD" : "en-US",
          )}
        </span>
      ),
      exportValue: o => new Date(o.created_at).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("admin.orders")}
        addLabel={locale === "bn" ? "নতুন অর্ডার (POS)" : "New Order (POS)"}
        onAdd={() => router.push(`/${locale}/admin/orders/new`)}
      />

      <div className="mb-4 w-56">
        <FloatingSelect
          label={t("order.status")}
          value={status}
          onChange={val => {
            setStatus(val);
            setPage(1);
          }}
        >
          <option value="">{t("common.all")}</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>
              {t(`order.${s}`)}
            </option>
          ))}
        </FloatingSelect>
      </div>

      <ReusableTable
        data={data?.data ?? []}
        columns={columns}
        keyExtractor={o => o.id}
        isLoading={isLoading}
        totalPages={data?.pagination?.total_pages ?? 1}
        totalRecords={data?.pagination?.total}
        currentPage={page}
        onPageChange={setPage}
        exportFilename="orders"
        emptyMessage={locale === "bn" ? "কোনো অর্ডার নেই" : "No orders found"}
        quickActions={[
          {
            label: t("common.edit"),
            render: o => (
              <Link
                href={`/${locale}/admin/orders/${o.id}`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                title={t("common.edit")}
              >
                <Eye className="w-3.5 h-3.5" />
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}

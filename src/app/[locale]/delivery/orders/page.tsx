"use client";

import { useGetOrdersQuery } from "@/api/orders/ordersApi";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import { Column, ReusableTable } from "@/components/ui/ReusableTable";
import { SalesOrder } from "@/lib/types";
import { formatAmount, formatDate, localName } from "@/utils/format";
import { Eye } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useState } from "react";

const STATUS_FILTERS = [
  { value: "ASSIGNED", label_bn: "নির্ধারিত", label_en: "Assigned" },
  { value: "ON_THE_WAY", label_bn: "পথে আছে", label_en: "On the Way" },
  { value: "DELIVERED", label_bn: "ডেলিভারি হয়েছে", label_en: "Delivered" },
  { value: "RETURNED", label_bn: "ফেরত", label_en: "Returned" },
  { value: "", label_bn: "সব", label_en: "All" },
];

export default function DeliveryOrdersPage() {
  const locale = useLocale();
  const [status, setStatus] = useState("ASSIGNED");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useGetOrdersQuery({
    status,
    page,
    page_size: limit,
  });

  const columns: Column<SalesOrder>[] = [
    {
      header: locale === "bn" ? "অর্ডার নম্বর" : "Order",
      accessor: o => (
        <span className="font-mono text-sm font-semibold text-gray-800">
          {o.order_number}
        </span>
      ),
      exportValue: o => o.order_number,
    },
    {
      header: locale === "bn" ? "গ্রাহক" : "Customer",
      accessor: o => (
        <div>
          <p className="text-sm font-medium text-gray-800">
            {localName(o.shipping_name_bn, o.shipping_name_en, locale === "bn")}
          </p>
          <p className="text-xs text-gray-500">{o.shipping_phone}</p>
        </div>
      ),
      exportValue: o =>
        `${localName(o.shipping_name_bn, o.shipping_name_en, locale === "bn")} · ${o.shipping_phone}`,
    },
    {
      header: locale === "bn" ? "ঠিকানা" : "Address",
      accessor: o => (
        <p className="text-xs text-gray-500">
          {[o.shipping_district, o.shipping_thana].filter(Boolean).join(", ")}
        </p>
      ),
      exportValue: o =>
        [o.shipping_district, o.shipping_thana].filter(Boolean).join(", "),
    },
    {
      header: locale === "bn" ? "মোট" : "Total",
      accessor: o => (
        <span className="text-sm font-bold text-amber-600">
          {formatAmount(o.grand_total, locale, 0)}
        </span>
      ),
      exportValue: o => o.grand_total,
    },
    {
      header: locale === "bn" ? "স্ট্যাটাস" : "Status",
      accessor: o => <OrderStatusBadge status={o.status} locale={locale} />,
      exportValue: o => o.status,
    },
    {
      header: locale === "bn" ? "তারিখ" : "Date",
      accessor: o => (
        <span className="text-xs text-gray-400">
          {formatDate(o.created_at, locale)}
        </span>
      ),
      exportValue: o => new Date(o.created_at).toLocaleDateString(),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <PageHeader title={locale === "bn" ? "আমার ডেলিভারি" : "My Deliveries"} />

      <div className="flex gap-2 flex-wrap mb-4">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              status === f.value
                ? "bg-amber-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-amber-300"
            }`}
          >
            {locale === "bn" ? f.label_bn : f.label_en}
          </button>
        ))}
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
        limit={limit}
        onLimitChange={l => {
          setLimit(l);
          setPage(1);
        }}
        exportFilename="deliveries"
        emptyMessage={
          locale === "bn" ? "কোনো ডেলিভারি নেই" : "No deliveries found"
        }
        emptyIcon={<span className="text-2xl">📦</span>}
        quickActions={[
          {
            label: locale === "bn" ? "দেখুন" : "View",
            render: o => (
              <Link
                href={`/${locale}/delivery/orders/${o.id}`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                title={locale === "bn" ? "দেখুন" : "View"}
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

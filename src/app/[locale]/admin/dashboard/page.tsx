"use client";

import { useGetDashboardSummaryQuery } from "@/api/dashboard/dashboardApi";
import Spinner from "@/components/ui/Spinner";
import PageHeader from "@/components/ui/PageHeader";
import { useLocale, useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { data, isLoading } = useGetDashboardSummaryQuery();

  if (isLoading) return <Spinner />;

  const cards = [
    { label: t("todayOrders"), value: data?.today_orders, icon: "🛍️" },
    {
      label: t("todayRevenue"),
      value: `৳${data?.today_revenue ?? "0"}`,
      icon: "💰",
    },
    { label: t("pendingOrders"), value: data?.pending_orders, icon: "⏳" },
    { label: t("lowStock"), value: data?.low_stock_count, icon: "⚠️" },
    { label: t("totalCustomers"), value: data?.total_customers, icon: "👥" },
    { label: t("totalProducts"), value: data?.total_products, icon: "📦" },
  ];

  return (
    <div>
      <PageHeader title={t('dashboard')} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="card flex items-center gap-4">
            <span className="text-3xl">{c.icon}</span>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {c.value ?? "—"}
              </p>
              <p className="text-sm text-gray-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

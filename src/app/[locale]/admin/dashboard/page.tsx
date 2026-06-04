"use client";

import { useGetDashboardSummaryQuery } from "@/api/dashboard/dashboardApi";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { formatAmount, formatNumber } from "@/utils/format";
import { useLocale, useTranslations } from "next-intl";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";


const STAT_CARDS = [
  { key: "today_orders",    labelKey: "todayOrders",    icon: "🛍️", color: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-100" },
  { key: "today_revenue",   labelKey: "todayRevenue",   icon: "💰", color: "bg-green-50",  text: "text-green-600",  border: "border-green-100",  isCurrency: true },
  { key: "pending_orders",  labelKey: "pendingOrders",  icon: "⏳", color: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-100" },
  { key: "low_stock_count", labelKey: "lowStock",       icon: "⚠️", color: "bg-red-50",    text: "text-red-600",    border: "border-red-100" },
  { key: "total_customers", labelKey: "totalCustomers", icon: "👥", color: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
  { key: "total_products",  labelKey: "totalProducts",  icon: "📦", color: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" },
] as const;

const STATUS_META: Record<string, { label_bn: string; label_en: string; color: string }> = {
  PENDING:     { label_bn: "অপেক্ষমাণ",    label_en: "Pending",     color: "#f59e0b" },
  CONFIRMED:   { label_bn: "নিশ্চিত",       label_en: "Confirmed",   color: "#3b82f6" },
  PACKED:      { label_bn: "প্যাক করা",     label_en: "Packed",      color: "#8b5cf6" },
  ASSIGNED:    { label_bn: "বরাদ্দ",        label_en: "Assigned",    color: "#06b6d4" },
  ON_THE_WAY:  { label_bn: "পথে আছে",      label_en: "On the Way",  color: "#f97316" },
  DELIVERED:   { label_bn: "ডেলিভারি হয়েছে", label_en: "Delivered",  color: "#22c55e" },
  RETURNED:    { label_bn: "ফেরত",          label_en: "Returned",    color: "#ef4444" },
  CANCELLED:   { label_bn: "বাতিল",         label_en: "Cancelled",   color: "#6b7280" },
};

export default function DashboardPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const isBn = locale === "bn";
  const { data, isLoading } = useGetDashboardSummaryQuery();

  if (isLoading) return <Spinner />;

  const year = new Date().getFullYear();

  const incomeKey = isBn ? "আয়" : "Income";
  const expenseKey = isBn ? "খরচ" : "Expense";

  const chartData = (data?.monthly_revenue_chart ?? []).map(d => ({
    month: new Date(d.month).toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short" }),
    [incomeKey]:  parseFloat(d.revenue),
    [expenseKey]: parseFloat(d.expense || "0"),
  }));

  const statusRows = (data?.status_breakdown ?? []).filter(r => r.count > 0);
  const maxCount = Math.max(...statusRows.map(r => r.count), 1);

  return (
    <div className="space-y-5">
      <PageHeader title={t("dashboard")} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_CARDS.map(card => {
          const raw = data?.[card.key];
          const value = ("isCurrency" in card && card.isCurrency)
            ? formatAmount(raw ?? 0, locale, 0)
            : formatNumber(Number(raw ?? 0), locale);
          return (
            <div key={card.key} className={`bg-white rounded-2xl border ${card.border} p-4 flex items-start gap-4 shadow-sm`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${card.color}`}>
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t(card.labelKey)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart + Status panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Monthly revenue line chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-base font-bold text-gray-800">
                {isBn ? "মাসিক ওভারভিউ" : "Monthly Overview"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isBn ? "আয় বনাম খরচ" : "Income vs Expense"}
              </p>
            </div>
            <span className="text-sm font-semibold text-gray-400">{year}</span>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`}
                  width={52}
                />
                <Tooltip
                  formatter={(v) => [formatAmount(Number(v ?? 0), locale, 0)]}
                  contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                <Line
                  type="monotone"
                  dataKey={incomeKey}
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#0f766e", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey={expenseKey}
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  strokeDasharray="6 3"
                  dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              {isBn ? "ডেটা নেই" : "No data yet"}
            </div>
          )}
        </div>

        {/* Order status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-800 mb-4">
            {isBn ? "অর্ডারের অবস্থা" : "Order Status"}
          </h2>
          <div className="space-y-4">
            {statusRows.map(row => {
              const meta = STATUS_META[row.status];
              if (!meta) return null;
              const pct = Math.round((row.count / maxCount) * 100);
              return (
                <div key={row.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">
                      {isBn ? meta.label_bn : meta.label_en}
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                      {formatNumber(row.count, locale)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
            {statusRows.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                {isBn ? "কোনো অর্ডার নেই" : "No orders yet"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

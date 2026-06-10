"use client";

import { useGetDashboardSummaryQuery, RecentOrder, TopProduct } from "@/api/dashboard/dashboardApi";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatAmount, formatNumber } from "@/utils/format";
import { useLocale, useTranslations } from "next-intl";
import {
  CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ─── Stat card definitions ────────────────────────────────────────────────────
const STAT_CARDS = [
  { key: "today_orders",   labelKey: "todayOrders",   icon: "🛍️", color: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-100" },
  { key: "today_revenue",  labelKey: "todayRevenue",  icon: "💰", color: "bg-green-50",  text: "text-green-600",  border: "border-green-100",  isCurrency: true },
  { key: "pending_orders", labelKey: "pendingOrders", icon: "⏳", color: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-100" },
  { key: "low_stock_count",labelKey: "lowStock",      icon: "⚠️", color: "bg-red-50",    text: "text-red-600",    border: "border-red-100" },
  { key: "total_customers",labelKey: "totalCustomers",icon: "👥", color: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
  { key: "total_products", labelKey: "totalProducts", icon: "📦", color: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" },
] as const;

const STATUS_META: Record<string, { label_bn: string; label_en: string; color: string }> = {
  PENDING:    { label_bn: "পেন্ডিং",        label_en: "Pending",    color: "#f59e0b" },
  CONFIRMED:  { label_bn: "নিশ্চিত",         label_en: "Confirmed",  color: "#3b82f6" },
  PACKED:     { label_bn: "প্যাক করা",       label_en: "Packed",     color: "#8b5cf6" },
  ASSIGNED:   { label_bn: "এসাইন্ড",         label_en: "Assigned",   color: "#06b6d4" },
  ON_THE_WAY: { label_bn: "পথে আছে",        label_en: "On the Way", color: "#f97316" },
  DELIVERED:  { label_bn: "ডেলিভারি হয়েছে", label_en: "Delivered",  color: "#22c55e" },
  RETURNED:   { label_bn: "ফেরত",           label_en: "Returned",   color: "#ef4444" },
  CANCELLED:  { label_bn: "বাতিল",          label_en: "Cancelled",  color: "#6b7280" },
};

const STATUS_BADGE: Record<string, string> = {
  PENDING:    "bg-amber-50 text-amber-700 border-amber-100",
  CONFIRMED:  "bg-blue-50 text-blue-700 border-blue-100",
  PACKED:     "bg-purple-50 text-purple-700 border-purple-100",
  ASSIGNED:   "bg-cyan-50 text-cyan-700 border-cyan-100",
  ON_THE_WAY: "bg-orange-50 text-orange-700 border-orange-100",
  DELIVERED:  "bg-green-50 text-green-700 border-green-100",
  RETURNED:   "bg-red-50 text-red-700 border-red-100",
  CANCELLED:  "bg-gray-50 text-gray-600 border-gray-200",
};

export default function DashboardPage() {
  const t      = useTranslations("admin");
  const locale = useLocale();
  const isBn   = locale === "bn";
  const { data, isLoading } = useGetDashboardSummaryQuery();

  if (isLoading) return (
    <div className="space-y-5">
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Skeleton className="lg:col-span-2 h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );

  const year       = new Date().getFullYear();
  const incomeKey  = isBn ? "আয়" : "Income";
  const expenseKey = isBn ? "খরচ" : "Expense";

  const chartData = (data?.monthly_revenue_chart ?? []).map(d => ({
    month: new Date(d.month).toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short" }),
    [incomeKey]:  parseFloat(d.revenue),
    [expenseKey]: parseFloat(d.expense || "0"),
  }));

  const statusRows = (data?.status_breakdown ?? []).filter(r => r.count > 0);
  const maxCount   = Math.max(...statusRows.map(r => r.count), 1);

  const revPct     = data?.revenue_change_pct ?? null;
  const profitVal  = parseFloat(data?.this_month_profit ?? "0");

  const topRevenue = Math.max(...(data?.top_products ?? []).map(p => parseFloat(p.revenue)), 1);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("dashboard")}
        description={isBn ? "ব্যবসার সার্বিক অবস্থার সংক্ষিপ্ত চিত্র" : "Overview of your business performance"}
      />

      {/* ── Row 1: Today / quick stats ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {STAT_CARDS.map(card => {
          const raw   = data?.[card.key];
          const value = "isCurrency" in card && card.isCurrency
            ? formatAmount(raw ?? 0, locale, 0)
            : formatNumber(Number(raw ?? 0), locale);

          const isOutOfStock = card.key === "low_stock_count" && (data?.out_of_stock_count ?? 0) > 0;
          return (
            <div key={card.key} className={`bg-white rounded-2xl border ${card.border} p-4 flex items-start gap-3 shadow-sm`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${card.color}`}>
                {card.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t(card.labelKey)}</p>
                {isOutOfStock && (
                  <p className="text-xs text-red-500 mt-0.5 font-medium">
                    +{formatNumber(data!.out_of_stock_count, locale)} {isBn ? "স্টক শেষ" : "out of stock"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Row 2: Financial health ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* This month revenue */}
        <div className="bg-white rounded-2xl border border-teal-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">{isBn ? "এই মাসের আয়" : "This Month Revenue"}</p>
          <p className="text-xl font-bold text-teal-700">{formatAmount(data?.this_month_revenue ?? "0", locale, 0)}</p>
          {revPct !== null && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${revPct > 0 ? "text-green-600" : revPct < 0 ? "text-red-500" : "text-gray-400"}`}>
              {revPct > 0 ? <TrendingUp className="w-3 h-3" /> : revPct < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {revPct > 0 ? "+" : ""}{formatNumber(revPct, locale)}% {isBn ? "গত মাসের তুলনায়" : "vs last month"}
            </div>
          )}
        </div>

        {/* This month profit */}
        <div className={`bg-white rounded-2xl border p-4 shadow-sm ${profitVal >= 0 ? "border-green-100" : "border-red-100"}`}>
          <p className="text-xs text-gray-500 mb-1">{isBn ? "এই মাসের নিট লাভ" : "This Month Net Profit"}</p>
          <p className={`text-xl font-bold ${profitVal >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatAmount(data?.this_month_profit ?? "0", locale, 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{isBn ? "আয় − খরচ" : "Revenue − Expenses"}</p>
        </div>

        {/* Supplier outstanding */}
        <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">{isBn ? "সরবরাহকারী বাকি" : "Supplier Outstanding"}</p>
          <p className="text-xl font-bold text-orange-600">{formatAmount(data?.supplier_outstanding ?? "0", locale, 0)}</p>
          <p className="text-xs text-gray-400 mt-1">{isBn ? "ক্রেডিট ক্রয়ের বকেয়া" : "Unpaid credit purchases"}</p>
        </div>

        {/* Loan + partner outstanding */}
        <div className="bg-white rounded-2xl border border-red-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">{isBn ? "ঋণ + অংশীদার বাকি" : "Loan + Partner Due"}</p>
          <p className="text-xl font-bold text-red-600">
            {formatAmount(String((parseFloat(data?.loan_outstanding ?? "0") + parseFloat(data?.partner_outstanding ?? "0")).toFixed(2)), locale, 0)}
          </p>
          <div className="flex gap-2 mt-1">
            <span className="text-xs text-gray-400">
              {isBn ? "ঋণ:" : "Loan:"} {formatAmount(data?.loan_outstanding ?? "0", locale, 0)}
            </span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">
              {isBn ? "অংশীদার:" : "Partner:"} {formatAmount(data?.partner_outstanding ?? "0", locale, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Row 3: Chart + Status ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-base font-bold text-gray-800">{isBn ? "মাসিক ওভারভিউ" : "Monthly Overview"}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{isBn ? "আয় বনাম খরচ" : "Income vs Expense"}</p>
            </div>
            <span className="text-sm font-semibold text-gray-400">{year}</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} width={52} />
                <Tooltip formatter={v => [formatAmount(Number(v ?? 0), locale, 0)]} contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                <Line type="monotone" dataKey={incomeKey}  stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3, fill: "#0f766e", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey={expenseKey} stroke="#ef4444" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">{isBn ? "ডেটা নেই" : "No data yet"}</div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-800 mb-4">{isBn ? "অর্ডারের অবস্থা" : "Order Status"}</h2>
          <div className="space-y-4">
            {statusRows.map(row => {
              const meta = STATUS_META[row.status];
              if (!meta) return null;
              const pct = Math.round((row.count / maxCount) * 100);
              return (
                <div key={row.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{isBn ? meta.label_bn : meta.label_en}</span>
                    <span className="text-sm font-bold text-gray-800">{formatNumber(row.count, locale)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                  </div>
                </div>
              );
            })}
            {statusRows.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">{isBn ? "কোনো অর্ডার নেই" : "No orders yet"}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 4: Recent orders + Top products ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-800 mb-4">{isBn ? "সাম্প্রতিক অর্ডার" : "Recent Orders"}</h2>
          {(data?.recent_orders ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{isBn ? "কোনো অর্ডার নেই" : "No orders yet"}</p>
          ) : (
            <div className="space-y-2">
              {(data?.recent_orders ?? []).map((order: RecentOrder) => {
                const name = isBn ? (order.name_bn || order.name_en) : (order.name_en || order.name_bn);
                const meta = STATUS_META[order.status];
                const badge = STATUS_BADGE[order.status] ?? "bg-gray-50 text-gray-600 border-gray-200";
                const dateStr = new Date(order.created_at).toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short", day: "numeric" });
                return (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{order.order_number}</p>
                        <p className="text-xs text-gray-400 truncate">{name} · {dateStr}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-gray-800">{formatAmount(order.grand_total, locale, 0)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badge}`}>
                        {isBn ? meta?.label_bn : meta?.label_en}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-800 mb-4">{isBn ? "শীর্ষ পণ্য (আয়)" : "Top Products"}</h2>
          {(data?.top_products ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{isBn ? "কোনো বিক্রয় নেই" : "No sales yet"}</p>
          ) : (
            <div className="space-y-4">
              {(data?.top_products ?? []).map((p: TopProduct, idx: number) => {
                const rev  = parseFloat(p.revenue);
                const pct  = Math.round((rev / topRevenue) * 100);
                const name = isBn ? p.name_bn : p.name_en;
                const rankColors = ["text-amber-500", "text-gray-400", "text-orange-400", "text-gray-300", "text-gray-300"];
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs font-bold w-4 shrink-0 ${rankColors[idx]}`}>#{formatNumber(idx + 1, locale)}</span>
                        <span className="text-sm text-gray-700 truncate">{name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800 shrink-0 ml-2">{formatAmount(p.revenue, locale, 0)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

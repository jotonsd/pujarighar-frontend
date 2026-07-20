"use client";

import {
  PagespeedCategory,
  useDisconnectGoogleMutation,
  useGetGooglePropertiesQuery,
  useGetGoogleStatusQuery,
  useGetPagespeedSeoQuery,
  useGetSalesMetricsQuery,
  useGetSeoMetricsQuery,
  useGetTrafficMetricsQuery,
  useLazyGetGoogleConnectUrlQuery,
  useSelectGooglePropertyMutation,
} from "@/api/analytics/analyticsApi";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { FloatingDatePicker, FloatingSelect } from "@/components/ui/forms";
import { toast } from "@/store/toastStore";
import { formatAmount, formatNumber } from "@/utils/format";
import {
  BarChart3, CheckCircle2, Globe2, LinkIcon, Search, TrendingUp, Unplug,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayIso() { return new Date().toISOString().slice(0, 10); }
function daysAgoIso(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
function fmtDate(iso: string, isBn: boolean) {
  return new Date(iso).toLocaleDateString(isBn ? "bn-BD" : "en-US", { month: "short", day: "numeric" });
}

// ─── Small building blocks ──────────────────────────────────────────────────
function StatTile({ label, value, tone = "gray" }: { label: string; value: string; tone?: string }) {
  const toneMap: Record<string, string> = {
    blue: "border-blue-100 text-blue-600",
    teal: "border-teal-100 text-teal-700",
    amber: "border-amber-100 text-amber-600",
    violet: "border-violet-100 text-violet-600",
    orange: "border-orange-100 text-orange-600",
    red: "border-red-100 text-red-600",
    gray: "border-gray-100 text-gray-700",
  };
  return (
    <div className={`bg-white rounded-2xl border p-4 shadow-sm ${toneMap[tone]}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${toneMap[tone].split(" ")[1]}`}>{value}</p>
    </div>
  );
}

function RankedBars({ rows, max, colorClass = "bg-blue-500" }: { rows: { label: string; value: number; sub?: string }[]; max: number; colorClass?: string }) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-3">
      {rows.map((row, idx) => {
        const pct = Math.round((row.value / max) * 100);
        return (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-sm text-gray-700 truncate">{row.label}</span>
              <span className="text-sm font-bold text-gray-800 shrink-0">{formatNumber(row.value, "en")}{row.sub ? ` · ${row.sub}` : ""}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 text-center py-6">{text}</p>;
}

// ─── Traffic tab ─────────────────────────────────────────────────────────────
function TrafficTab({ from, to, isBn }: { from: string; to: string; isBn: boolean }) {
  const { data, isLoading } = useGetTrafficMetricsQuery({ from, to });

  if (isLoading) return <Skeleton className="h-80 rounded-2xl" />;
  if (!data) return <EmptyNote text={isBn ? "ডেটা লোড করা যায়নি" : "Could not load data"} />;

  const chartData = data.daily.map(d => ({
    date: fmtDate(d.date, isBn),
    [isBn ? "সেশন" : "Sessions"]: d.sessions,
    [isBn ? "ইউজার" : "Users"]: d.total_users,
  }));
  const maxSourceSessions = Math.max(...data.top_traffic_sources.map(s => s.sessions), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label={isBn ? "মোট সেশন" : "Sessions"} value={formatNumber(data.sessions_total, "en")} tone="blue" />
        <StatTile label={isBn ? "মোট ইউজার" : "Total Users"} value={formatNumber(data.users_total, "en")} tone="teal" />
        <StatTile label={isBn ? "নতুন ইউজার" : "New Users"} value={formatNumber(data.new_users_total, "en")} tone="violet" />
        <StatTile label={isBn ? "ফিরে আসা ইউজার" : "Returning Users"} value={formatNumber(data.returning_users_total, "en")} tone="orange" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-3">{isBn ? "সেশন ও ইউজার প্রবণতা" : "Sessions & Users Trend"}</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
              <Line type="monotone" dataKey={isBn ? "সেশন" : "Sessions"} stroke="#2a78d6" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey={isBn ? "ইউজার" : "Users"} stroke="#1baf7a" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : <EmptyNote text={isBn ? "কোনো ডেটা নেই" : "No data yet"} />}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-3">{isBn ? "শীর্ষ ট্রাফিক সোর্স" : "Top Traffic Sources"}</h3>
        {data.top_traffic_sources.length > 0 ? (
          <RankedBars
            rows={data.top_traffic_sources.map(s => ({ label: s.source, value: s.sessions }))}
            max={maxSourceSessions}
          />
        ) : <EmptyNote text={isBn ? "কোনো ট্রাফিক ডেটা নেই" : "No traffic data yet"} />}
      </div>
    </div>
  );
}

// ─── Sales tab ───────────────────────────────────────────────────────────────
function SalesTab({ from, to, isBn }: { from: string; to: string; isBn: boolean }) {
  const { data, isLoading } = useGetSalesMetricsQuery({ from, to });

  if (isLoading) return <Skeleton className="h-80 rounded-2xl" />;
  if (!data) return <EmptyNote text={isBn ? "ডেটা লোড করা যায়নি" : "Could not load data"} />;

  const funnel = [
    { label: isBn ? "কার্টে যোগ" : "Add to Cart", value: data.add_to_cart_count, shade: "bg-blue-300" },
    { label: isBn ? "চেকআউট শুরু" : "Checkout Started", value: data.checkout_starts, shade: "bg-blue-500" },
    { label: isBn ? "ক্রয় সম্পন্ন" : "Purchases", value: data.purchases, shade: "bg-blue-700" },
  ];
  const funnelMax = Math.max(data.add_to_cart_count, 1);
  const maxProductRevenue = Math.max(...data.top_selling_products.map(p => p.revenue), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label={isBn ? "আয়" : "Revenue"} value={formatAmount(data.revenue, "en", 0)} tone="teal" />
        <StatTile label={isBn ? "গড় অর্ডার মূল্য" : "Avg Order Value"} value={formatAmount(data.average_order_value, "en", 0)} tone="blue" />
        <StatTile label={isBn ? "কনভার্সন রেট" : "Conversion Rate"} value={`${data.conversion_rate}%`} tone="violet" />
        <StatTile label={isBn ? "কার্ট ছাড়ার হার" : "Cart Abandonment"} value={`${data.cart_abandonment_rate}%`} tone="orange" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-3">{isBn ? "কেনাকাটার ফানেল" : "Purchase Funnel"}</h3>
        <RankedBars rows={funnel.map(f => ({ label: f.label, value: f.value }))} max={funnelMax} colorClass="bg-blue-600" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-3">{isBn ? "শীর্ষ বিক্রীত পণ্য" : "Top Selling Products"}</h3>
        {data.top_selling_products.length > 0 ? (
          <RankedBars
            rows={data.top_selling_products.map(p => ({ label: p.name, value: p.revenue, sub: `${p.units_sold} ${isBn ? "ইউনিট" : "units"}` }))}
            max={maxProductRevenue}
            colorClass="bg-teal-600"
          />
        ) : <EmptyNote text={isBn ? "কোনো বিক্রয় ডেটা নেই" : "No sales data yet"} />}
      </div>
    </div>
  );
}

// ─── SEO tab ─────────────────────────────────────────────────────────────────
function CwvMeter({ label, bucket }: { label: string; bucket?: { good: number; needs_improvement: number; poor: number } | null }) {
  if (!bucket) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden flex bg-gray-100">
        <div className="h-full bg-green-500" style={{ width: `${bucket.good}%` }} title={`Good ${bucket.good}%`} />
        <div className="h-full bg-amber-400" style={{ width: `${bucket.needs_improvement}%` }} title={`Needs improvement ${bucket.needs_improvement}%`} />
        <div className="h-full bg-red-500" style={{ width: `${bucket.poor}%` }} title={`Poor ${bucket.poor}%`} />
      </div>
      <div className="flex justify-between text-[11px] text-gray-400 mt-1">
        <span>{isFinite(bucket.good) ? `${bucket.good}% good` : ""}</span>
        <span>{bucket.poor}% poor</span>
      </div>
    </div>
  );
}

const PSI_CATEGORY_META: { key: PagespeedCategory; label_bn: string; label_en: string }[] = [
  { key: "performance", label_bn: "পারফরম্যান্স", label_en: "Performance" },
  { key: "accessibility", label_bn: "অ্যাক্সেসিবিলিটি", label_en: "Accessibility" },
  { key: "best_practices", label_bn: "বেস্ট প্র্যাকটিস", label_en: "Best Practices" },
  { key: "seo", label_bn: "এসইও", label_en: "SEO" },
];

const PSI_LAB_METRIC_LABELS: Record<string, { bn: string; en: string }> = {
  "first-contentful-paint": { bn: "প্রথম কন্টেন্ট পেইন্ট", en: "First Contentful Paint" },
  "largest-contentful-paint": { bn: "লার্জেস্ট কন্টেন্ট পেইন্ট", en: "Largest Contentful Paint" },
  "total-blocking-time": { bn: "টোটাল ব্লকিং টাইম", en: "Total Blocking Time" },
  "cumulative-layout-shift": { bn: "কিউমুলেটিভ লেআউট শিফট", en: "Cumulative Layout Shift" },
  "speed-index": { bn: "স্পিড ইনডেক্স", en: "Speed Index" },
};

function ScoreRing({ score }: { score: number | null }) {
  if (score === null) return <div className="w-14 h-14 rounded-full border-4 border-gray-100 flex items-center justify-center shrink-0"><span className="text-xs text-gray-300">—</span></div>;
  const color = score >= 90 ? "text-green-600 border-green-100 bg-green-50" : score >= 50 ? "text-amber-500 border-amber-100 bg-amber-50" : "text-red-600 border-red-100 bg-red-50";
  return (
    <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center shrink-0 ${color}`}>
      <span className="text-lg font-bold">{score}</span>
    </div>
  );
}

function PagespeedSeoCards({ isBn }: { isBn: boolean }) {
  const { data, isLoading } = useGetPagespeedSeoQuery();

  if (isLoading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
    </div>
  );

  if (!data?.available) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-1">{isBn ? "পেজস্পিড ইনসাইটস" : "PageSpeed Insights"}</h3>
        <EmptyNote text={
          data?.reason === 'no_score_returned'
            ? (isBn ? "স্কোর পাওয়া যায়নি" : "No score returned")
            : (isBn ? "কনফিগার করা হয়নি (CRUX_API_KEY)" : "Not configured (CRUX_API_KEY missing)")
        } />
      </div>
    );
  }

  const scores = data.scores;
  const issues = data.failing_issues;
  const lab = data.lab_metrics ?? {};

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {PSI_CATEGORY_META.map(cat => (
          <div key={cat.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <ScoreRing score={scores?.[cat.key] ?? null} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800">{isBn ? cat.label_bn : cat.label_en}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {issues?.[cat.key]?.length ? `${issues[cat.key].length} ${isBn ? "সমস্যা" : "issues"}` : (isBn ? "কোনো সমস্যা নেই" : "No issues")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {Object.keys(lab).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">{isBn ? "ল্যাব পারফরম্যান্স মেট্রিক্স (মোবাইল)" : "Lab Performance Metrics (mobile)"}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {Object.entries(lab).map(([id, value]) => (
              <div key={id}>
                <p className="text-sm font-bold text-gray-800">{value}</p>
                <p className="text-xs text-gray-400">{PSI_LAB_METRIC_LABELS[id] ? (isBn ? PSI_LAB_METRIC_LABELS[id].bn : PSI_LAB_METRIC_LABELS[id].en) : id}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {PSI_CATEGORY_META.some(cat => issues?.[cat.key]?.length) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">{isBn ? "সমাধানযোগ্য সমস্যা" : "Issues to Fix"}</h3>
          <div className="space-y-4">
            {PSI_CATEGORY_META.filter(cat => issues?.[cat.key]?.length).map(cat => (
              <div key={cat.key}>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">{isBn ? cat.label_bn : cat.label_en}</p>
                <ul className="space-y-1">
                  {issues![cat.key].slice(0, 5).map((issue, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span>{issue.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SeoTab({ from, to, isBn }: { from: string; to: string; isBn: boolean }) {
  const { data, isLoading } = useGetSeoMetricsQuery({ from, to });

  if (isLoading) return <Skeleton className="h-80 rounded-2xl" />;
  if (!data) return <EmptyNote text={isBn ? "ডেটা লোড করা যায়নি" : "Could not load data"} />;

  const clicksData = data.daily.map(d => ({ date: fmtDate(d.date, isBn), value: d.clicks }));
  const impressionsData = data.daily.map(d => ({ date: fmtDate(d.date, isBn), value: d.impressions }));
  const maxQueryClicks = Math.max(...data.top_queries.map(q => q.clicks), 1);
  const maxPageClicks = Math.max(...data.top_pages.map(p => p.clicks), 1);
  const cwv = data.core_web_vitals;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label={isBn ? "ক্লিক" : "Clicks"} value={formatNumber(data.clicks_total, "en")} tone="blue" />
        <StatTile label={isBn ? "ইমপ্রেশন" : "Impressions"} value={formatNumber(data.impressions_total, "en")} tone="teal" />
        <StatTile label="CTR" value={`${data.ctr_total}%`} tone="violet" />
        <StatTile label={isBn ? "গড় পজিশন" : "Avg Position"} value={`${data.avg_position}`} tone="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">{isBn ? "ক্লিক প্রবণতা" : "Clicks Trend"}</h3>
          {clicksData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={clicksData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                <Line type="monotone" dataKey="value" name={isBn ? "ক্লিক" : "Clicks"} stroke="#2a78d6" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyNote text={isBn ? "কোনো ডেটা নেই" : "No data yet"} />}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">{isBn ? "ইমপ্রেশন প্রবণতা" : "Impressions Trend"}</h3>
          {impressionsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={impressionsData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                <Line type="monotone" dataKey="value" name={isBn ? "ইমপ্রেশন" : "Impressions"} stroke="#1baf7a" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyNote text={isBn ? "কোনো ডেটা নেই" : "No data yet"} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">{isBn ? "শীর্ষ ১০ সার্চ কোয়েরি" : "Top 10 Search Queries"}</h3>
          {data.top_queries.length > 0 ? (
            <RankedBars rows={data.top_queries.map(q => ({ label: q.query, value: q.clicks, sub: `#${q.position}` }))} max={maxQueryClicks} />
          ) : <EmptyNote text={isBn ? "কোনো কোয়েরি ডেটা নেই" : "No query data yet"} />}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">{isBn ? "শীর্ষ ১০ ল্যান্ডিং পেজ" : "Top 10 Landing Pages"}</h3>
          {data.top_pages.length > 0 ? (
            <RankedBars rows={data.top_pages.map(p => ({ label: p.page, value: p.clicks, sub: `#${p.position}` }))} max={maxPageClicks} colorClass="bg-teal-600" />
          ) : <EmptyNote text={isBn ? "কোনো পেজ ডেটা নেই" : "No page data yet"} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-1">{isBn ? "ইনডেক্সড পেজ (সাইটম্যাপ অনুমান)" : "Indexed Pages (sitemap estimate)"}</h3>
          <p className="text-xs text-gray-400 mb-3">
            {isBn
              ? "সার্চ কনসোলে সঠিক ইনডেক্স সংখ্যার জন্য কোনো পাবলিক API নেই — এটি জমা দেওয়া সাইটম্যাপ থেকে অনুমান।"
              : "Search Console has no public API for the exact indexed count — this is estimated from your submitted sitemap."}
          </p>
          {data.indexed_pages_estimate.available ? (
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-bold text-gray-800">{formatNumber(data.indexed_pages_estimate.indexed, "en")}</p>
                <p className="text-xs text-gray-400">{isBn ? "ইনডেক্সড" : "Indexed"}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-400">{formatNumber(data.indexed_pages_estimate.submitted, "en")}</p>
                <p className="text-xs text-gray-400">{isBn ? "জমা দেওয়া" : "Submitted"}</p>
              </div>
            </div>
          ) : <EmptyNote text={isBn ? "কোনো সাইটম্যাপ জমা দেওয়া হয়নি" : "No sitemap submitted yet"} />}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-1">{isBn ? "কোর ওয়েব ভাইটালস (মোবাইল)" : "Core Web Vitals (mobile)"}</h3>
          <p className="text-xs text-gray-400 mb-3">
            {isBn ? "গুগলের মোবাইল ইউজেবিলিটি রিপোর্ট বন্ধ হওয়ার পর এটিই বাস্তব বিকল্প (Chrome ইউজার ডেটা)।" : "Real substitute for Google's retired Mobile Usability report (Chrome field data)."}
          </p>
          {cwv.available ? (
            <div className="space-y-3">
              <CwvMeter label="Largest Contentful Paint (LCP)" bucket={cwv.largest_contentful_paint} />
              <CwvMeter label="Interaction to Next Paint (INP)" bucket={cwv.interaction_to_next_paint} />
              <CwvMeter label="Cumulative Layout Shift (CLS)" bucket={cwv.cumulative_layout_shift} />
            </div>
          ) : (
            <EmptyNote text={
              cwv.reason === 'insufficient_traffic_data'
                ? (isBn ? "পর্যাপ্ত ট্রাফিক ডেটা নেই (Google requires minimum sample)" : "Insufficient Chrome traffic data for this site yet")
                : (isBn ? "কনফিগার করা হয়নি (CRUX_API_KEY)" : "Not configured (CRUX_API_KEY missing)")
            } />
          )}
        </div>
      </div>

      <PagespeedSeoCards isBn={isBn} />
    </div>
  );
}

// ─── Connect / picker states ────────────────────────────────────────────────
function ConnectCard({ isBn }: { isBn: boolean }) {
  const [trigger, { isFetching }] = useLazyGetGoogleConnectUrlQuery();

  const handleConnect = async () => {
    try {
      const res = await trigger().unwrap();
      window.location.href = res.auth_url;
    } catch {
      toast.error(isBn ? "সংযোগ শুরু করা যায়নি" : "Could not start connection");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
        <LinkIcon className="w-7 h-7 text-blue-600" />
      </div>
      <div>
        <h2 className="text-base font-bold text-gray-800">{isBn ? "গুগল অ্যানালিটিক্স ও সার্চ কনসোল সংযুক্ত করুন" : "Connect Google Analytics & Search Console"}</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-md">
          {isBn
            ? "আপনার গুগল অ্যাকাউন্ট দিয়ে সাইন ইন করুন যাতে ট্রাফিক, বিক্রয় ও এসইও ডেটা এখানেই দেখতে পারেন।"
            : "Sign in with your Google account to see traffic, sales, and SEO data right here."}
        </p>
      </div>
      <button onClick={handleConnect} disabled={isFetching} className="btn-primary">
        {isFetching ? (isBn ? "সংযোগ হচ্ছে..." : "Connecting...") : (isBn ? "গুগল দিয়ে সংযুক্ত করুন" : "Connect with Google")}
      </button>
    </div>
  );
}

function PickerCard({ isBn }: { isBn: boolean }) {
  const { data, isLoading } = useGetGooglePropertiesQuery();
  const [selectProperty, { isLoading: isSaving }] = useSelectGooglePropertyMutation();
  const [propertyId, setPropertyId] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  const handleSave = async () => {
    if (!propertyId || !siteUrl) return;
    const prop = data?.ga4_properties.find(p => p.property_id === propertyId);
    try {
      await selectProperty({ ga4_property_id: propertyId, ga4_property_name: prop?.display_name ?? "", gsc_site_url: siteUrl }).unwrap();
      toast.success(isBn ? "সংরক্ষিত হয়েছে" : "Saved");
    } catch {
      toast.error(isBn ? "সংরক্ষণ ব্যর্থ হয়েছে" : "Failed to save");
    }
  };

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <h2 className="text-base font-bold text-gray-800">{isBn ? "সংযুক্ত হয়েছে — এখন নির্বাচন করুন" : "Connected — now pick your property"}</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {isBn ? "কোন GA4 প্রপার্টি ও সার্চ কনসোল সাইট থেকে ডেটা আনতে চান তা বেছে নিন।" : "Choose which GA4 property and Search Console site to pull data from."}
      </p>
      <div className="space-y-4">
        <FloatingSelect
          label={isBn ? "GA4 প্রপার্টি" : "GA4 Property"}
          value={propertyId}
          onChange={setPropertyId}
          options={(data?.ga4_properties ?? []).map(p => ({ value: p.property_id, label: `${p.account_name} — ${p.display_name}` }))}
        />
        <FloatingSelect
          label={isBn ? "সার্চ কনসোল সাইট" : "Search Console Site"}
          value={siteUrl}
          onChange={setSiteUrl}
          options={(data?.gsc_sites ?? []).map(s => ({ value: s.site_url, label: s.site_url }))}
        />
        <button onClick={handleSave} disabled={isSaving || !propertyId || !siteUrl} className="btn-primary w-full">
          {isSaving ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save & Continue")}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
type TabId = "traffic" | "sales" | "seo";

export default function AnalyticsPage() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: status, isLoading: statusLoading } = useGetGoogleStatusQuery();
  const [disconnect] = useDisconnectGoogleMutation();
  const [active, setActive] = useState<TabId>("traffic");
  const [from, setFrom] = useState(daysAgoIso(29));
  const [to, setTo] = useState(todayIso());

  useEffect(() => {
    if (searchParams.get("connected")) {
      toast.success(isBn ? "গুগল সফলভাবে সংযুক্ত হয়েছে" : "Google account connected successfully");
      router.replace("/admin/analytics");
    } else if (searchParams.get("error")) {
      toast.error(isBn ? "সংযোগ ব্যর্থ হয়েছে, আবার চেষ্টা করুন" : "Connection failed, please try again");
      router.replace("/admin/analytics");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDisconnect = async () => {
    if (!confirm(isBn ? "সংযোগ বিচ্ছিন্ন করতে চান?" : "Disconnect Google account?")) return;
    try {
      await disconnect().unwrap();
      toast.success(isBn ? "সংযোগ বিচ্ছিন্ন হয়েছে" : "Disconnected");
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed");
    }
  };

  const TABS: { id: TabId; icon: React.ReactNode; label_bn: string; label_en: string }[] = useMemo(() => [
    { id: "traffic", icon: <Globe2 className="w-4 h-4" />, label_bn: "ট্রাফিক", label_en: "Traffic" },
    { id: "sales", icon: <TrendingUp className="w-4 h-4" />, label_bn: "বিক্রয়", label_en: "Sales" },
    { id: "seo", icon: <Search className="w-4 h-4" />, label_bn: "এসইও", label_en: "SEO" },
  ], []);

  return (
    <div className="space-y-4">
      <PageHeader
        title={isBn ? "অ্যানালিটিক্স ও এসইও" : "Analytics & SEO"}
        description={isBn ? "গুগল অ্যানালিটিক্স ও সার্চ কনসোল ডেটা একসাথে দেখুন" : "Google Analytics and Search Console data in one place"}
        actions={status?.is_connected ? (
          <button
            onClick={handleDisconnect}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors"
          >
            <Unplug className="w-3.5 h-3.5" />
            {isBn ? "বিচ্ছিন্ন করুন" : "Disconnect"}
          </button>
        ) : undefined}
      />

      {statusLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : !status?.is_connected ? (
        <ConnectCard isBn={isBn} />
      ) : !status.has_selection ? (
        <PickerCard isBn={isBn} />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="flex gap-1 bg-gray-50 rounded-xl p-1 w-fit">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active === tab.id ? "bg-white shadow-sm text-amber-700" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.icon}
                  {isBn ? tab.label_bn : tab.label_en}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-36"><FloatingDatePicker label={isBn ? "শুরু" : "From"} value={from} onChange={setFrom} maxDate={new Date(to)} /></div>
              <div className="w-36"><FloatingDatePicker label={isBn ? "শেষ" : "To"} value={to} onChange={setTo} minDate={new Date(from)} maxDate={new Date()} /></div>
            </div>
          </div>

          {active === "traffic" && <TrafficTab from={from} to={to} isBn={isBn} />}
          {active === "sales" && <SalesTab from={from} to={to} isBn={isBn} />}
          {active === "seo" && <SeoTab from={from} to={to} isBn={isBn} />}
        </>
      )}
    </div>
  );
}

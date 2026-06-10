"use client";
import { formatAmount } from "@/utils/format";
import { useGetProfitLossQuery } from "@/api/accounting/accountingApi";
import { FloatingDatePicker } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/skeletons";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

export default function ProfitLossPage() {
  const t      = useTranslations("accounting");
  const locale = useLocale();
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");

  const { data: pl, isLoading } = useGetProfitLossQuery({ from, to });

  return (
    <div>
      <PageHeader
        title={locale === "bn" ? "লাভ-ক্ষতি" : "Profit & Loss"}
        description={locale === "bn" ? "নির্দিষ্ট সময়ের আয়, ব্যয় ও নিট মুনাফা" : "Revenue, expenses and net profit for a period"}
      />

      <div className="flex gap-3 mb-6 max-w-sm">
        <div className="flex-1">
          <FloatingDatePicker label={locale === "bn" ? "শুরু তারিখ" : "From"} value={from} onChange={setFrom} clearable />
        </div>
        <div className="flex-1">
          <FloatingDatePicker label={locale === "bn" ? "শেষ তারিখ" : "To"} value={to} onChange={setTo} clearable />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton columns={2} rows={3} />
      ) : pl ? (
        <div className="flex gap-3 items-start">
          <div className="card flex-1 max-w-sm">
            {[
              { label: t("revenue"),   value: pl.revenue,    color: "text-green-600" },
              { label: t("expense"),   value: pl.expense,    color: "text-amber-500" },
              {
                label: t("netProfit"),
                value: pl.net_profit,
                color: Number(pl.net_profit) >= 0 ? "text-green-700" : "text-red-600",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between py-3 border-b last:border-0">
                <span className="text-gray-700">{label}</span>
                <span className={`font-bold ${color}`}>{formatAmount(value, locale)}</span>
              </div>
            ))}
          </div>

          {pl.equity_shares && pl.equity_shares.length > 0 && (
            <div className="card flex-1 max-w-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {locale === "bn" ? "অংশীদারদের লাভ বণ্টন" : "Partner Profit Distribution"}
              </h3>
              {pl.equity_shares.map(s => (
                <div key={s.partner_id} className="flex justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="text-sm text-gray-800">{locale === "bn" ? s.name_bn || s.name_en : s.name_en || s.name_bn}</p>
                    <p className="text-xs text-amber-500">{s.percentage}%</p>
                  </div>
                  <span className={`font-bold text-sm ${Number(s.share_amount) >= 0 ? "text-green-700" : "text-red-600"}`}>
                    {formatAmount(s.share_amount, locale)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

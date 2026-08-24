"use client";

import LogsTab from "@/components/admin/sms/LogsTab";
import OverviewTab from "@/components/admin/sms/OverviewTab";
import SettingsTab from "@/components/admin/sms/SettingsTab";
import PageHeader from "@/components/ui/PageHeader";
import { useLocale } from "next-intl";
import { useState } from "react";

type Tab = "overview" | "logs" | "settings";

export default function SmsDashboardPage() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label_bn: string; label_en: string }[] = [
    { id: "overview", label_bn: "সারসংক্ষেপ", label_en: "Overview" },
    { id: "logs", label_bn: "লগ", label_en: "Logs" },
    { id: "settings", label_bn: "সেটিং", label_en: "Settings" },
  ];

  return (
    <div>
      <PageHeader
        title={isBn ? "এসএমএস" : "SMS"}
        description={isBn ? "গ্রাহক এসএমএস নোটিফিকেশন পাঠানো, ইতিহাস দেখা ও কনফিগার করুন" : "Send customer SMS notifications, view history, and configure your gateway"}
      />

      <div className="flex items-center gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? "border-amber-500 text-amber-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {isBn ? t.label_bn : t.label_en}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab isBn={isBn} />}
      {tab === "logs" && <LogsTab isBn={isBn} />}
      {tab === "settings" && <SettingsTab isBn={isBn} />}
    </div>
  );
}

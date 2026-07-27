"use client";

import ConsignmentsTab from "@/components/admin/courier/ConsignmentsTab";
import PaymentsTab from "@/components/admin/courier/PaymentsTab";
import ProvidersTab from "@/components/admin/courier/ProvidersTab";
import ReturnsTab from "@/components/admin/courier/ReturnsTab";
import PageHeader from "@/components/ui/PageHeader";
import { useLocale } from "next-intl";
import { useState } from "react";

type Tab = "consignments" | "returns" | "payments" | "providers";

export default function CourierDashboardPage() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const [tab, setTab] = useState<Tab>("consignments");

  const tabs: { id: Tab; label_bn: string; label_en: string }[] = [
    { id: "consignments", label_bn: "কনসাইনমেন্ট", label_en: "Consignments" },
    { id: "returns", label_bn: "ফেরত অনুরোধ", label_en: "Return Requests" },
    { id: "payments", label_bn: "পেমেন্ট", label_en: "Payments" },
    { id: "providers", label_bn: "প্রোভাইডার", label_en: "Providers" },
  ];

  return (
    <div>
      <PageHeader
        title={isBn ? "কুরিয়ার" : "Courier"}
        description={isBn ? "Steadfast কুরিয়ার পাঠানো, ট্র্যাকিং ও সেটিংস সব একসাথে" : "Send, track, and configure your courier — all in one place"}
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

      {tab === "consignments" && <ConsignmentsTab locale={locale} isBn={isBn} />}
      {tab === "returns" && <ReturnsTab isBn={isBn} />}
      {tab === "payments" && <PaymentsTab isBn={isBn} />}
      {tab === "providers" && <ProvidersTab locale={locale} isBn={isBn} />}
    </div>
  );
}

"use client";

import { useGetSmsStatsQuery } from "@/api/sms/smsApi";
import { FloatingDatePicker } from "@/components/ui/forms";
import { CheckCircle2, CreditCard, MessageSquare, XCircle } from "lucide-react";
import { useState } from "react";

export default function OverviewTab({ isBn }: { isBn: boolean }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, isLoading } = useGetSmsStatsQuery({ from: from || undefined, to: to || undefined });

  const cards = [
    {
      label: isBn ? "মোট পাঠানো" : "Total Sent",
      value: data?.total ?? 0,
      icon: <MessageSquare className="w-5 h-5 text-white" />,
      bg: "bg-blue-600",
    },
    {
      label: isBn ? "সফল" : "Success",
      value: data?.success ?? 0,
      icon: <CheckCircle2 className="w-5 h-5 text-white" />,
      bg: "bg-green-600",
    },
    {
      label: isBn ? "ব্যর্থ" : "Failed",
      value: data?.failed ?? 0,
      icon: <XCircle className="w-5 h-5 text-white" />,
      bg: "bg-red-600",
    },
    {
      label: isBn ? "বিল করা এসএমএস" : "Billed SMS",
      value: data?.billed_segments ?? 0,
      icon: <CreditCard className="w-5 h-5 text-white" />,
      bg: "bg-purple-600",
      hint: isBn
        ? "প্রোভাইডারের গণনার সাথে মিলে যায় — লম্বা বার্তা একাধিক এসএমএস হিসেবে বিল হয়"
        : "Matches your provider's count — long messages bill as 2+ SMS each",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <FloatingDatePicker label={isBn ? "শুরু তারিখ" : "From"} value={from} onChange={setFrom} clearable />
        <FloatingDatePicker label={isBn ? "শেষ তারিখ" : "To"} value={to} onChange={setTo} clearable />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`rounded-xl p-5 text-white ${c.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm opacity-90">{c.label}</span>
              {c.icon}
            </div>
            <p className="text-3xl font-bold">{isLoading ? "…" : c.value}</p>
            {c.hint && <p className="text-xs opacity-80 mt-1">{c.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

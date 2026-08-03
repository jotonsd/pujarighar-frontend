"use client";

import { useGetMyBaynaBookingsQuery } from "@/api/bayna/baynaApi";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { BaynaStatus } from "@/lib/types";
import { useLocale } from "next-intl";

const SERVICE_LABELS: Record<string, { bn: string; en: string }> = {
  PUJARI: { bn: "পূজারী", en: "Pujari" },
  DHAKI:  { bn: "ঢাকি",    en: "Dhaki" },
  MURTI:  { bn: "মূর্তি",   en: "Murti" },
};

const STATUS_BADGE: Record<BaynaStatus, { variant: "gray" | "blue" | "green" | "red"; bn: string; en: string }> = {
  PENDING:   { variant: "gray",  bn: "পেন্ডিং",     en: "Pending" },
  CONTACTED: { variant: "blue",  bn: "যোগাযোগ হয়েছে", en: "Contacted" },
  CONFIRMED: { variant: "green", bn: "নিশ্চিত",      en: "Confirmed" },
  COMPLETED: { variant: "green", bn: "সম্পন্ন",       en: "Completed" },
  CANCELLED: { variant: "red",   bn: "বাতিল",        en: "Cancelled" },
};

export default function MyBaynaBookingsPage() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const { data: bookings = [], isLoading } = useGetMyBaynaBookingsQuery();

  if (isLoading) return <Spinner />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">
        {isBn ? "আমার বায়না" : "My Bayna Requests"}
      </h1>

      {bookings.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          {isBn ? "কোনো বায়না অনুরোধ নেই" : "No bayna requests yet"}
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  {isBn ? SERVICE_LABELS[b.service_type]?.bn : SERVICE_LABELS[b.service_type]?.en}
                </span>
                <Badge variant={STATUS_BADGE[b.status].variant}>
                  {isBn ? STATUS_BADGE[b.status].bn : STATUS_BADGE[b.status].en}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(b.event_date).toLocaleDateString(isBn ? "bn-BD" : "en-US", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">{b.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

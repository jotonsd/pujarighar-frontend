"use client";

import { Truck } from "lucide-react";
import { useGetDeliveryChargesQuery } from "@/api/deliveryCharges/deliveryChargesApi";
import { formatAmount } from "@/utils/format";

export default function DeliveryChargesPreview({ locale, isBn }: { locale: string; isBn: boolean }) {
  const { data: charges } = useGetDeliveryChargesQuery();
  if (!charges) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto">
      <div className="card flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
          <Truck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-xs text-muted">{isBn ? "ঢাকার ভিতরে (শুরু)" : "Inside Dhaka (from)"}</p>
          <p className="font-bold text-body">{formatAmount(charges.inside_dhaka, locale, 0)}</p>
        </div>
      </div>
      <div className="card flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
          <Truck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-xs text-muted">{isBn ? "ঢাকার বাইরে (শুরু)" : "Outside Dhaka (from)"}</p>
          <p className="font-bold text-body">{formatAmount(charges.outside_dhaka, locale, 0)}</p>
        </div>
      </div>
    </div>
  );
}

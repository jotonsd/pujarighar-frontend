"use client";

import { useGetDeliveryPartnersQuery } from "@/api/courier/courierApi";
import { Truck } from "lucide-react";

// "Our delivery partners" strip under the checkout button — the active
// courier providers, with the logo uploaded in Admin → Courier → Providers.
export default function DeliveryPartners({ locale }: { locale: string }) {
  const isBn = locale === "bn";
  const { data: partners = [] } = useGetDeliveryPartnersQuery();

  if (partners.length === 0) return null;

  return (
    <div className="pt-3 border-t border-border">
      <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted mb-2">
        <Truck className="w-3.5 h-3.5" />
        {isBn ? "আমাদের ডেলিভারি পার্টনার" : "Our Delivery Partners"}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {partners.map(p => (
          <div
            key={p.id}
            title={p.name}
            className="h-10 min-w-[72px] px-3 rounded-lg border border-border bg-white flex items-center justify-center"
          >
            {p.logo ? (
              <img src={p.logo} alt={p.name} className="h-7 max-w-[96px] object-contain" />
            ) : (
              <span className="text-xs font-semibold text-gray-700">{p.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

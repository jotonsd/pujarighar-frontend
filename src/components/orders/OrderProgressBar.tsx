"use client";

import { OrderStatus } from "@/lib/types";
import Image from "next/image";
import { useEffect, useState } from "react";

const STAGES: { statuses: OrderStatus[]; label_bn: string; label_en: string }[] = [
  { statuses: ["PENDING", "CONFIRMED"], label_bn: "গৃহীত", label_en: "Accepted" },
  { statuses: ["PACKED"], label_bn: "প্যাক করা", label_en: "Packed" },
  { statuses: ["ASSIGNED"], label_bn: "ডেলিভারির জন্য প্রস্তুত", label_en: "Ready for Delivery" },
  { statuses: ["ON_THE_WAY"], label_bn: "পথে আছে", label_en: "In Transit" },
  { statuses: ["DELIVERED"], label_bn: "ডেলিভারি হয়েছে", label_en: "Delivered" },
];

export default function OrderProgressBar({ status, locale }: { status: OrderStatus; locale: string }) {
  const isBn = locale === "bn";

  const found = STAGES.findIndex(s => s.statuses.includes(status));
  const activeIndex = found === -1 ? 0 : found;
  const targetPct = (activeIndex / (STAGES.length - 1)) * 100;

  // Starts at 0 and animates up to the real position on first paint — reads
  // as the delivery "traveling" from the start of the journey to wherever
  // it actually is now, rather than just appearing already there.
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setPct(targetPct));
    return () => cancelAnimationFrame(id);
  }, [targetPct]);

  // Cancelled/returned don't fit a linear progress model — the existing
  // status badge already communicates those, so just skip the bar.
  if (status === "CANCELLED" || status === "RETURNED") return null;

  return (
    <div className="pt-9 pb-1">
      <div className="relative px-4">
        {/* Delivery vehicle marker, floating above the bar at the current stage */}
        <div
          className="absolute -top-8 transition-[left] duration-1000 ease-out"
          style={{ left: `${pct}%` }}
        >
          <div className="animate-vehicle-jitter">
            <Image
              src="/assets/logo/delivery-car.png"
              alt=""
              width={44}
              height={44}
              className="object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Track */}
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stage labels */}
      <div className="grid mt-2.5 px-1" style={{ gridTemplateColumns: `repeat(${STAGES.length}, minmax(0, 1fr))` }}>
        {STAGES.map((stage, i) => (
          <span
            key={i}
            className={`text-[10px] sm:text-xs leading-tight ${
              i === 0 ? "text-left" : i === STAGES.length - 1 ? "text-right" : "text-center"
            } ${i <= activeIndex ? "text-gray-800 font-semibold" : "text-gray-400"}`}
          >
            {isBn ? stage.label_bn : stage.label_en}
          </span>
        ))}
      </div>
    </div>
  );
}

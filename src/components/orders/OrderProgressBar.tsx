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

// How long one stage-to-stage move takes, and how long it pauses at each
// completed stage before continuing — kept in sync with the CSS transition
// duration below so the pause only starts once the move actually finishes.
const MOVE_MS = 1100;
const PAUSE_MS = 650;

export default function OrderProgressBar({ status, locale }: { status: OrderStatus; locale: string }) {
  const isBn = locale === "bn";

  const found = STAGES.findIndex(s => s.statuses.includes(status));
  const activeIndex = found === -1 ? 0 : found;

  // Steps through 0, 1, 2, ... activeIndex in sequence (rather than jumping
  // straight to the final position), pausing briefly at each completed
  // stage — replays from the start on every mount, i.e. every page load.
  const [visibleIndex, setVisibleIndex] = useState(0);
  useEffect(() => {
    setVisibleIndex(0);
    if (activeIndex <= 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let step = 1; step <= activeIndex; step++) {
      const delay = 400 + (step - 1) * (MOVE_MS + PAUSE_MS);
      timers.push(setTimeout(() => setVisibleIndex(step), delay));
    }
    return () => timers.forEach(clearTimeout);
  }, [activeIndex]);

  // Cancelled/returned don't fit a linear progress model — the existing
  // status badge already communicates those, so just skip the bar.
  if (status === "CANCELLED" || status === "RETURNED") return null;

  const pct = (visibleIndex / (STAGES.length - 1)) * 100;

  return (
    <div className="pt-9 pb-1">
      <div className="relative px-4">
        {/* Delivery vehicle marker, floating above the bar at the current stage */}
        <div
          className="absolute -top-8 ease-in-out"
          style={{ left: `${pct}%`, transitionProperty: "left", transitionDuration: `${MOVE_MS}ms` }}
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
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 ease-in-out"
            style={{ width: `${pct}%`, transitionProperty: "width", transitionDuration: `${MOVE_MS}ms` }}
          />
        </div>
      </div>

      {/* Stage labels */}
      <div className="grid mt-2.5 px-1" style={{ gridTemplateColumns: `repeat(${STAGES.length}, minmax(0, 1fr))` }}>
        {STAGES.map((stage, i) => (
          <span
            key={i}
            className={`text-[10px] sm:text-xs leading-tight transition-colors ${
              i === 0 ? "text-left" : i === STAGES.length - 1 ? "text-right" : "text-center"
            } ${i <= visibleIndex ? "text-gray-800 font-semibold" : "text-gray-400"}`}
          >
            {isBn ? stage.label_bn : stage.label_en}
          </span>
        ))}
      </div>
    </div>
  );
}

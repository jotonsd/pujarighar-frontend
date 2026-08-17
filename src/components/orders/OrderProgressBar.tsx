"use client";

import { OrderStatus } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";
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
  // Gated on the car image actually being loaded first, so the animation
  // never starts against an image that's still popping in mid-move.
  const [imageReady, setImageReady] = useState(false);
  const [visibleIndex, setVisibleIndex] = useState(0);
  useEffect(() => {
    setVisibleIndex(0);
    if (!imageReady || activeIndex <= 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let step = 1; step <= activeIndex; step++) {
      const delay = 250 + (step - 1) * (MOVE_MS + PAUSE_MS);
      timers.push(setTimeout(() => setVisibleIndex(step), delay));
    }
    return () => timers.forEach(clearTimeout);
  }, [activeIndex, imageReady]);

  // Cancelled/returned don't fit a linear progress model — the existing
  // status badge already communicates those, so just skip the bar.
  if (status === "CANCELLED" || status === "RETURNED") return null;

  const pct = (visibleIndex / (STAGES.length - 1)) * 100;
  // Only once the stepping animation has actually arrived at the end — not
  // the instant the order is marked delivered, so it doesn't jump ahead of
  // its own travel animation.
  const arrived = status === "DELIVERED" && visibleIndex === STAGES.length - 1;

  return (
    <div className="pt-10 pb-1">
      <div className="relative px-6">
        {/* Delivery vehicle marker, floating above the bar at the current stage.
            Stays put once delivered — gets a success badge, not a fade-out. */}
        <div
          className="absolute -top-10 -translate-x-1/2 ease-in-out"
          style={{
            // Clamped in px, not left as a bare percentage — at pct=100 a bare
            // `left: 100%` + translateX(-50%) pushes half the 56px-wide marker
            // past the container's right edge, so any ancestor with
            // overflow-x clipping (common for preventing horizontal scroll)
            // cuts the vehicle off right at the Delivered stage.
            left: `clamp(28px, ${pct}%, calc(100% - 28px))`,
            transitionProperty: "left",
            transitionDuration: `${MOVE_MS}ms`,
          }}
        >
          <div className="relative">
            <div className={arrived ? "" : "animate-vehicle-jitter"}>
              <Image
                src="/assets/logo/delivery-car.png"
                alt=""
                width={56}
                height={56}
                priority
                onLoad={() => setImageReady(true)}
                className="object-contain drop-shadow-md"
              />
            </div>
            {arrived && (
              <CheckCircle2 className="absolute -bottom-1 -right-1 w-5 h-5 text-white bg-green-600 rounded-full ring-2 ring-white" />
            )}
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

"use client";

import { OrderStatus } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const STAGES: { statuses: OrderStatus[]; label_bn: string; label_en: string }[] = [
  { statuses: ["PENDING", "CONFIRMED"], label_bn: "গৃহীত", label_en: "Accepted" },
  { statuses: ["PACKED"], label_bn: "প্যাক করা", label_en: "Packed" },
  { statuses: ["ASSIGNED", "PICKED"], label_bn: "ডেলিভারির জন্য প্রস্তুত", label_en: "Ready for Delivery" },
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
  // Tracks whether the car has actually finished sliding into its final spot
  // — visibleIndex flips the instant a step's timer fires, which is when the
  // CSS `left` transition *starts*, not when it visually finishes. Without
  // this, the success badge would pop in while the car is still mid-slide
  // from "In Transit" into the Delivered position.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    setVisibleIndex(0);
    setSettled(false);
    if (!imageReady || activeIndex <= 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let step = 1; step <= activeIndex; step++) {
      const delay = 250 + (step - 1) * (MOVE_MS + PAUSE_MS);
      timers.push(setTimeout(() => setVisibleIndex(step), delay));
    }
    const lastDelay = 250 + (activeIndex - 1) * (MOVE_MS + PAUSE_MS);
    timers.push(setTimeout(() => setSettled(true), lastDelay + MOVE_MS));
    return () => timers.forEach(clearTimeout);
  }, [activeIndex, imageReady]);

  // Cancelled/returned don't fit a linear progress model — the existing
  // status badge already communicates those, so just skip the bar.
  if (status === "CANCELLED" || status === "RETURNED") return null;

  const pct = (visibleIndex / (STAGES.length - 1)) * 100;
  // Only once the car has visually settled at the end — not the instant the
  // order is marked delivered, and not while it's still sliding there.
  const arrived = status === "DELIVERED" && visibleIndex === STAGES.length - 1 && settled;

  return (
    <div className="pt-10 pb-1">
      <div className="relative px-6">
        {/* Delivery vehicle marker, floating above the bar at the current stage.
            Stays put once delivered — gets a success badge, not a fade-out. */}
        <div
          className="absolute -top-12 -translate-x-1/2 ease-in-out"
          style={{
            // Clamped in px, not left as a bare percentage — at pct=100 a bare
            // `left: 100%` + translateX(-50%) pushes half the 64px-wide marker
            // past the container's right edge, so any ancestor with
            // overflow-x clipping (common for preventing horizontal scroll)
            // cuts the vehicle off right at the Delivered stage.
            left: `clamp(32px, ${pct}%, calc(100% - 32px))`,
            transitionProperty: "left",
            transitionDuration: `${MOVE_MS}ms`,
          }}
        >
          {/* Wrapper is a bit larger than the car image itself, so the
              success badge can sit just outside the car's own footprint —
              overlapping it (as when the badge sat flush on the image's
              corner) visually ate into the car and made it look smaller. */}
          <div className="relative w-[72px] h-[72px] flex items-center justify-center">
            {/* Gray air streaks flowing horizontally backward off the middle
                of the back — only while actually moving. Not once settled
                at Delivered, and not while still parked at the very first
                (Accepted) stage, since nothing's moving yet there either. */}
            {!arrived && visibleIndex > 0 && (
              <div className="absolute top-1/2 translate-y-1 left-1 flex items-center gap-1 pointer-events-none">
                <span className="block w-2.5 h-1 rounded-full bg-gray-400/80 blur-[1.5px] animate-air-trail" style={{ animationDelay: "0ms" }} />
                <span className="block w-2 h-1 rounded-full bg-gray-400/70 blur-[1.5px] animate-air-trail" style={{ animationDelay: "250ms" }} />
                <span className="block w-1.5 h-0.5 rounded-full bg-gray-400/60 blur-[1.5px] animate-air-trail" style={{ animationDelay: "500ms" }} />
              </div>
            )}
            <div className={arrived || visibleIndex === 0 ? "" : "animate-vehicle-jitter"}>
              <Image
                src="/assets/logo/delivery-car.png"
                alt=""
                width={64}
                height={64}
                priority
                quality={100}
                onLoad={() => setImageReady(true)}
                className="object-contain drop-shadow-md"
              />
            </div>
            {arrived && (
              <CheckCircle2 className="absolute top-0 right-0 w-5 h-5 text-white bg-green-600 rounded-full ring-2 ring-white" />
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

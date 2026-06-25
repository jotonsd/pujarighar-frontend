"use client";

import { formatNumber } from "@/utils/format";

interface Props {
  discountType: string;
  pct: number;
  diff: number;
  locale: string;
  className?: string;
}

export default function OfferBadge({
  discountType,
  pct,
  diff,
  locale,
  className = "",
}: Props) {
  return (
    <div
      className={`w-11 h-11 bg-green-600 text-white flex flex-col items-center justify-center pointer-events-none leading-none ${className}`}
      style={{
        clipPath: `polygon(
          50% 2%, 59% 7%, 68% 6%, 75% 13%,
          84% 16%, 87% 26%, 94% 32%, 93% 41%,
          98% 50%, 93% 59%, 94% 68%, 87% 75%,
          84% 84%, 75% 87%, 68% 94%, 59% 93%,
          50% 98%, 41% 93%, 32% 94%, 26% 87%,
          16% 84%, 13% 75%, 6% 68%, 7% 59%,
          2% 50%, 7% 41%, 6% 32%, 13% 26%,
          16% 16%, 26% 13%, 32% 6%, 41% 7%
        )`,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
      }}
    >
      <span className="text-[12px] font-extrabold">
        {discountType === "PERCENTAGE"
          ? `${formatNumber(pct, locale)}%`
          : `৳${formatNumber(diff, locale)}`}
      </span>
      <span className="text-[8px] font-extrabold uppercase tracking-wide">
        {locale === "bn" ? "ছাড়" : "OFF"}
      </span>
    </div>
  );
}

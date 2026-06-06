"use client";

import { useGetBannersQuery } from "@/api/banners/bannersApi";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function OfferBanners() {
  const locale = useLocale();
  const { data: banners = [], isLoading } = useGetBannersQuery();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => {
      setCurrent(prev => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(id);
  }, [banners.length]);

  if (isLoading) return <Skeleton className="h-28 w-full rounded-2xl mb-3" />;
  if (!banners.length) return null;

  const card = (banner: (typeof banners)[0]) => {
    const title = locale === "bn" ? banner.title_bn : banner.title_en;
    const subtitle = locale === "bn" ? banner.subtitle_bn : banner.subtitle_en;

    if (banner.image) {
      return (
        <div className="w-full h-28 rounded-2xl overflow-hidden shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    /* ── text-only banner ── */
    return (
      <div
        className="w-full h-28 rounded-2xl overflow-hidden relative flex items-center px-5 gap-3"
        style={{ backgroundColor: banner.bg_color ?? "#fef2f2" }}
      >
        {/* decorative circles */}
        <span
          className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10"
          style={{ backgroundColor: "#000" }}
          aria-hidden="true"
        />
        <span
          className="absolute right-10 -bottom-8 w-20 h-20 rounded-full opacity-10"
          style={{ backgroundColor: "#000" }}
          aria-hidden="true"
        />

        {/* left accent bar */}
        <span
          className="shrink-0 w-1 h-12 rounded-full"
          style={{ backgroundColor: "#f59e0b" }}
          aria-hidden="true"
        />

        {/* text content */}
        <div className="flex-1 min-w-0 z-10">
          {banner.badge_text && (
            <span className="inline-block text-[11px] font-bold bg-amber-500 text-white px-2.5 py-0.5 rounded-full mb-1.5 tracking-wide uppercase">
              {banner.badge_text}
            </span>
          )}
          <p className="font-bold text-gray-800 text-base leading-tight truncate">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        {/* arrow hint */}
        {banner.link && (
          <span
            className="shrink-0 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-amber-500"
            aria-hidden="true"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 7h8M7.5 3.5 11 7l-3.5 3.5"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="mb-3">
      {/* slide track */}
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map(banner =>
            banner.link ? (
              <Link
                key={banner.id}
                href={banner.link}
                className="w-full shrink-0 block hover:opacity-95 transition-opacity"
              >
                {card(banner)}
              </Link>
            ) : (
              <div key={banner.id} className="w-full shrink-0">
                {card(banner)}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

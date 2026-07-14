"use client";

import { useGetHeroSlidesQuery } from "@/api/heroSlides/heroSlidesApi";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HeroSlider() {
  const locale = useLocale();
  const { data: slides = [], isLoading } = useGetHeroSlidesQuery();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(
      () => setCurrent(p => (p + 1) % slides.length),
      4000,
    );
    return () => clearInterval(id);
  }, [slides.length]);

  if (isLoading)
    return <Skeleton className="h-48 md:h-96 w-full rounded-2xl mb-10" />;
  if (!slides.length) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl mb-10">
      {/* Track */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={slide.id} className="w-full h-48 md:h-96 shrink-0 relative">
            {slide.image ? (
              <>
                <Image
                  src={slide.image}
                  alt={locale === "bn" ? slide.title_bn : slide.title_en}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
                {/* Overlay for text */}
                {(slide.title_bn || slide.title_en) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex flex-col justify-end md:justify-center px-5 md:px-10 pb-8 md:pb-0">
                    <h1 className="text-sm md:text-4xl font-bold text-white mb-1 md:mb-2 drop-shadow leading-snug line-clamp-2">
                      {locale === "bn" ? slide.title_bn : slide.title_en}
                    </h1>
                    {(slide.subtitle_bn || slide.subtitle_en) && (
                      <p className="text-white/80 text-[10px] md:text-base mb-3 md:mb-5 max-w-md drop-shadow line-clamp-2 md:line-clamp-none">
                        {locale === "bn"
                          ? slide.subtitle_bn
                          : slide.subtitle_en}
                      </p>
                    )}
                    {slide.cta_link &&
                      (slide.cta_label_bn || slide.cta_label_en) && (
                        <Link
                          href={slide.cta_link}
                          className="btn-primary self-start px-4 py-2 md:px-6 md:py-2.5 text-sm md:text-base"
                        >
                          {locale === "bn"
                            ? slide.cta_label_bn
                            : slide.cta_label_en}
                        </Link>
                      )}
                  </div>
                )}
              </>
            ) : (
              /* Text-only slide */
              <div
                className="w-full h-48 md:h-96 flex flex-col items-center justify-center text-center px-5 md:px-6"
                style={{ backgroundColor: slide.bg_color || "#FFF7ED" }}
              >
                <h1 className="text-base md:text-4xl font-bold text-amber-800 mb-2 md:mb-3 leading-snug line-clamp-2">
                  {locale === "bn" ? slide.title_bn : slide.title_en}
                </h1>
                {(slide.subtitle_bn || slide.subtitle_en) && (
                  <p className="text-gray-600 text-[11px] md:text-lg mb-5 md:mb-7 max-w-lg">
                    {locale === "bn" ? slide.subtitle_bn : slide.subtitle_en}
                  </p>
                )}
                {slide.cta_link &&
                  (slide.cta_label_bn || slide.cta_label_en) && (
                    <Link
                      href={slide.cta_link}
                      className="btn-primary px-6 py-2.5 md:px-8 md:py-3 text-sm md:text-base"
                    >
                      {locale === "bn"
                        ? slide.cta_label_bn
                        : slide.cta_label_en}
                    </Link>
                  )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={locale === "bn" ? `স্লাইড ${i + 1}-এ যান` : `Go to slide ${i + 1}`}
              aria-current={i === current}
              className="p-2.5 flex items-center justify-center"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-5 h-1.5 bg-amber-500"
                    : "w-1.5 h-1.5 bg-white/60"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

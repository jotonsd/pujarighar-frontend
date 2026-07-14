"use client";

import { Product } from "@/lib/types";
import PackageCard from "@/components/products/PackageCard";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function HomePackagesClient({ packages }: { packages: Product[] }) {
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Manual & Autoplay Scroll Logic (moves item-by-item)
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current;
      // Calculate width of exactly one single item depending on viewport size
      const itemWidth =
        window.innerWidth >= 768 ? clientWidth / 3 : clientWidth / 2;

      let scrollTo =
        direction === "left" ? scrollLeft - itemWidth : scrollLeft + itemWidth;

      // Infinite loop logic: Loop back to start if reaching the end, or jump to end if going back from start
      if (
        direction === "right" &&
        scrollLeft + clientWidth >= scrollWidth - 10
      ) {
        scrollTo = 0;
      } else if (direction === "left" && scrollLeft <= 10) {
        scrollTo = scrollWidth - clientWidth;
      }

      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  // Autoplay Effect: Slides every 5 seconds if not hovered and items > 2
  useEffect(() => {
    if (packages.length <= 2 || isHovered) return;

    const interval = setInterval(() => {
      scroll("right");
    }, 5000); // 5000ms = 5 seconds

    return () => clearInterval(interval);
  }, [packages.length, isHovered]);

  if (!packages.length) return null;

  return (
    <section className="mb-8 w-full px-4 md:px-0">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎁</span>
          <h2 className="text-xl font-bold text-gray-800">
            {locale === "bn" ? "পূজার প্যাকেজ" : "Puja Packages"}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* View All Link */}
          <Link
            href={`/${locale}/packages`}
            aria-label={locale === "bn" ? "সব প্যাকেজ দেখুন" : "View all packages"}
            className="text-sm text-amber-600 hover:underline font-medium"
          >
            {locale === "bn" ? "সব দেখুন →" : "View all →"}
          </Link>

          {/* Manual Control Slide Buttons */}
          {packages.length > 2 && (
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => scroll("left")}
                className="p-1.5 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 text-gray-600 transition active:scale-95"
                aria-label="Previous slide"
              >
                ←
              </button>
              <button
                onClick={() => scroll("right")}
                className="p-1.5 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 text-gray-600 transition active:scale-95"
                aria-label="Next slide"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {packages.length > 2 ? (
        /* Slider Layout with Hover state listeners */
        <div
          className="relative w-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {packages.map(pkg => (
              <div
                key={pkg.id}
                // Width calculations keep exact grid styling proportions (3 on Desktop, 2 on Mobile)
                className="w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] shrink-0 snap-start"
              >
                <PackageCard pkg={pkg} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Fallback Static Grid Layout (When items count is 2 or less) */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {packages.map(pkg => (
            <PackageCard key={pkg.id} pkg={pkg} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}

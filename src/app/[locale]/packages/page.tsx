"use client";

import { useGetProductsQuery } from "@/api/products/productsApi";
import OfferBanners from "@/components/products/OfferBanners";
import PackageCard from "@/components/products/PackageCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Product } from "@/lib/types";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

export default function PackagesPage() {
  const locale = useLocale();

  const [page, setPage] = useState(1);
  const [allPackages, setAllPackages] = useState<Product[]>([]);

  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(false);

  const { data, isLoading, isFetching } = useGetProductsQuery({
    page,
    is_package: "true",
  });

  const totalPages = data?.pagination?.total_pages ?? 1;
  const hasMore = page < totalPages;

  isFetchingRef.current = isFetching;
  hasMoreRef.current = hasMore;

  useEffect(() => {
    if (!data?.data) return;
    setAllPackages(prev => (page === 1 ? data.data : [...prev, ...data.data]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    const onScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 300;
      if (nearBottom && !isFetchingRef.current && hasMoreRef.current) {
        setPage(prev => prev + 1);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const CardSkeleton = () => (
    <div className="card p-0 overflow-hidden flex flex-col">
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <div className="mb-6">
        <OfferBanners />
      </div>

      {isLoading && allPackages.length === 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {allPackages.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">🎁</p>
              <p>
                {locale === "bn" ? "কোনো প্যাকেজ নেই" : "No packages available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {allPackages.map(pkg => (
                <PackageCard key={pkg.id} pkg={pkg} locale={locale} />
              ))}
            </div>
          )}

          {isFetching && allPackages.length > 0 && (
            <div className="py-6 flex justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

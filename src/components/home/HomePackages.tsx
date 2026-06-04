"use client";

import { useGetProductsQuery } from "@/api/products/productsApi";
import PackageCard from "@/components/products/PackageCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLocale } from "next-intl";
import Link from "next/link";

export default function HomePackages() {
  const locale = useLocale();
  const { data, isLoading } = useGetProductsQuery({
    is_package: "true",
    page_size: 6,
  });
  const packages = data?.data ?? [];

  if (!isLoading && !packages.length) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">
          {locale === "bn" ? "পূজার প্যাকেজ" : "Puja Packages"}
        </h2>
        <Link
          href={`/${locale}/packages`}
          className="text-sm text-amber-600 hover:underline font-medium"
        >
          {locale === "bn" ? "সব দেখুন →" : "View all →"}
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden border border-gray-100"
              >
                <Skeleton className="h-56 w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          : packages.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} locale={locale} />
            ))}
      </div>
    </section>
  );
}

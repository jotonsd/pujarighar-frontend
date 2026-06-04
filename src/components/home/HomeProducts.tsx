"use client";

import { useGetProductsQuery } from "@/api/products/productsApi";
import ProductCard from "@/components/products/ProductCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLocale } from "next-intl";
import Link from "next/link";

export default function HomeProducts() {
  const locale = useLocale();
  const { data, isLoading } = useGetProductsQuery({
    is_package: "false",
    page_size: 18,
  });
  const products = data?.data ?? [];

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">
          {locale === "bn" ? "সকল পণ্য" : "All Products"}
        </h2>
        <Link
          href={`/${locale}/products`}
          className="text-sm text-amber-600 hover:underline font-medium"
        >
          {locale === "bn" ? "সব দেখুন →" : "View all →"}
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {isLoading
          ? Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="card p-0 overflow-hidden">
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          : products.map(product => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
      </div>
    </section>
  );
}

"use client";

import { useGetRecommendedProductsQuery } from "@/api/products/productsApi";
import ProductCard from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/skeletons";
import { useLocale } from "next-intl";

export default function RecommendedForYou() {
  const locale = useLocale();
  const { data, isLoading, isUninitialized } = useGetRecommendedProductsQuery({ limit: 12 });
  // Only show in full rows of 6 — fewer than 6 isn't worth a section.
  const showCount = Math.floor((data?.length ?? 0) / 6) * 6;
  const products = (data ?? []).slice(0, showCount);

  if (!isLoading && !isUninitialized && showCount === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">✨</span>
        <h2 className="text-xl font-bold text-gray-800">
          {locale === "bn" ? "শুধু আপনার জন্য" : "Recommended for You"}
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map(product => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
      </div>
    </section>
  );
}

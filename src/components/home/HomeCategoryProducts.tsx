"use client";

import { useGetPopularByCategoryQuery } from "@/api/products/productsApi";
import ProductCard from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/skeletons";
import { useLocale } from "next-intl";
import Link from "next/link";

export default function HomeCategoryProducts() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const { data, isLoading } = useGetPopularByCategoryQuery();
  // Only show a category row in full sets of 6 — fewer than 6 isn't worth a row.
  const categories = (data?.data ?? [])
    .map(({ category, products }) => ({
      category,
      products: products.slice(0, Math.floor(products.length / 6) * 6),
    }))
    .filter(({ products }) => products.length > 0);

  if (isLoading) {
    return (
      <div className="space-y-10 mb-8">
        {Array.from({ length: 2 }).map((_, si) => (
          <section key={si}>
            <div className="flex items-center justify-between mb-5">
              <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="space-y-10 mb-8">
      {categories.map(({ category, products }) => (
        <section key={category.id}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪔</span>
              <h2 className="text-xl font-bold text-gray-800">
                {isBn ? category.name_bn : category.name_en}
              </h2>
            </div>
            <Link
              href={`/${locale}/products?category=${category.id}`}
              className="text-sm text-amber-600 hover:underline font-medium shrink-0"
            >
              {isBn ? "সব দেখুন →" : "View all →"}
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {products.map(product => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

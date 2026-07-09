"use client";

import { useGetProductsQuery } from "@/api/products/productsApi";
import ProductCard from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/skeletons";
import { useLocale } from "next-intl";
import Link from "next/link";

export default function HomeOffers() {
  const locale = useLocale();
  const { data, isLoading } = useGetProductsQuery({
    is_package: "false",
    has_discount: true,
    ordering: "discount_desc",
    page_size: 12,
  });
  const products = data?.data ?? [];

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏷️</span>
          <h2 className="text-xl font-bold text-gray-800">
            {locale === "bn" ? "অফার" : "Offers"}
          </h2>
          <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
            {locale === "bn" ? "ছাড়" : "Sale"}
          </span>
        </div>
        <Link
          href={`/${locale}/products?offers=true`}
          className="text-sm text-amber-600 hover:underline font-medium"
        >
          {locale === "bn" ? "সব দেখুন →" : "View all →"}
        </Link>
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

"use client";

import { CategoryWithProducts } from "@/api/products/productsApi";
import ProductCard from "@/components/products/ProductCard";
import { useLocale } from "next-intl";
import Link from "next/link";

export default function HomeCategoryProductsClient({
  categories,
}: {
  categories: CategoryWithProducts[];
}) {
  const locale = useLocale();
  const isBn = locale === "bn";

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
              aria-label={
                isBn
                  ? `${category.name_bn} - সব দেখুন`
                  : `View all ${category.name_en}`
              }
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

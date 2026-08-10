"use client";

import { Product } from "@/lib/types";
import ProductCard from "@/components/products/ProductCard";
import { Sparkles } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";

export default function HomeNewArrivalsClient({ products }: { products: Product[] }) {
  const locale = useLocale();
  // Only show in full rows of 6 — fewer than 6 isn't worth a section.
  const showCount = Math.floor(products.length / 6) * 6;
  const items = products.slice(0, showCount);

  if (showCount === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-800">
            {locale === "bn" ? "নতুন এসেছে" : "New Arrivals"}
          </h2>
        </div>
        <Link
          href={`/${locale}/products?badges=new,flash_sale,trendy`}
          aria-label={locale === "bn" ? "সব নতুন পণ্য দেখুন" : "View all new arrivals"}
          className="text-sm text-amber-700 hover:underline font-medium"
        >
          {locale === "bn" ? "সব দেখুন →" : "View all →"}
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            locale={locale}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
          />
        ))}
      </div>
    </section>
  );
}

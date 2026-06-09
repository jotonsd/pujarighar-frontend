"use client";

import { Product } from "@/lib/types";
import { formatAmount, formatNumber, localName } from "@/utils/format";
import Link from "next/link";

interface Props {
  pkg: Product;
  locale: string;
}

export default function PackageCard({ pkg, locale }: Props) {
  const name = localName(pkg.name_bn, pkg.name_en, locale === "bn");

  const originalPrice =
    pkg.package_items?.reduce(
      (sum, item) =>
        sum + parseFloat(item.unit_price ?? "0") * Number(item.quantity),
      0,
    ) ?? 0;

  const finalPrice = parseFloat(pkg.unit_price ?? "0");
  const hasDiscount =
    pkg.discount_type !== "NONE" && originalPrice > finalPrice;

  return (
    <Link href={`/${locale}/packages/${pkg.id}`} className="group block">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
        {/* Image */}
        <div className="h-36 md:h-56 bg-amber-50 relative overflow-hidden">
          {pkg.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pkg.images[0].image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🎁
            </div>
          )}
          {hasDiscount && (
            <span className="absolute top-2 left-2 text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
              {pkg.discount_type === "PERCENTAGE"
                ? `${formatNumber(pkg.discount_value, locale)}% ${locale === "bn" ? "ছাড়" : "OFF"}`
                : `${formatAmount(pkg.discount_value, locale, 0)} ${locale === "bn" ? "ছাড়" : "OFF"}`}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3 pb-2 flex-1">
          <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-1.5">
            {name}
          </p>

          {pkg.package_items?.length > 0 && (
            <p className="text-xs text-gray-400 mb-2">
              {formatNumber(pkg.package_items.length, locale)}{" "}
              {locale === "bn" ? "টি পণ্য" : "items"}
            </p>
          )}

          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-amber-600">
              {formatAmount(finalPrice, locale, 0)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatAmount(originalPrice, locale, 0)}
              </span>
            )}
          </div>
        </div>

        {/* Details button */}
        <div className="px-3 pb-3">
          <span className="block w-full text-center text-[10px] font-bold py-1.5 rounded bg-amber-500 text-white group-hover:bg-amber-600 transition-colors">
            {locale === "bn" ? "বিস্তারিত" : "Details"}
          </span>
        </div>
      </div>
    </Link>
  );
}

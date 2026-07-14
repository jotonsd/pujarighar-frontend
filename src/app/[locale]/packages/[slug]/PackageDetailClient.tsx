"use client";

import { useAddToCartMutation } from "@/api/cart/cartApi";
import { useGetProductQuery } from "@/api/products/productsApi";
import OfferBanners from "@/components/products/OfferBanners";
import ProductReviews from "@/components/products/ProductReviews";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useGuestCartStore } from "@/store/guestCartStore";
import { toast } from "@/store/toastStore";
import { formatAmount, formatNumber, localName } from "@/utils/format";
import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PackageDetailClient({ id }: { id: string }) {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const [qty, setQty] = useState(1);

  const { isAuthenticated } = useAuthStore();
  const setItemCount = useCartStore(s => s.setItemCount);
  const guestAddItem = useGuestCartStore(s => s.addItem);

  const { data: pkg, isLoading } = useGetProductQuery(id);
  const [addToCart, { isLoading: adding }] = useAddToCartMutation();

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push(`/${locale}/cart`);
  };

  const handleAddToCart = async () => {
    if (!pkg) return;
    if (!isAuthenticated) {
      guestAddItem({
        product_id:          pkg.id,
        name_bn:             pkg.name_bn,
        name_en:             pkg.name_en,
        unit_price:          String(pkg.effective_price ?? pkg.unit_price),
        original_unit_price: String(pkg.original_price ?? pkg.unit_price),
        stock:               Number(pkg.stock_on_hand),
        is_package:          true,
        package_items:       (pkg.package_items ?? []).map(pi => ({
          component_name_bn: pi.component_name_bn,
          component_name_en: pi.component_name_en,
          quantity: String(pi.quantity),
        })),
        image: pkg.images?.[0]?.image,
      });
      toast.success(locale === "bn" ? "কার্টে যোগ হয়েছে" : "Added to cart");
      return;
    }
    try {
      const cart = await addToCart({
        product_id: pkg.id,
        quantity: String(qty),
      }).unwrap();
      setItemCount(cart.item_count);
      toast.success(locale === "bn" ? "কার্টে যোগ হয়েছে" : "Added to cart");
    } catch (err: unknown) {
      const e = err as {
        data?: {
          errors?: { details?: { message_bn?: string; message_en?: string } };
        };
      };
      toast.error(
        locale === "bn"
          ? (e.data?.errors?.details?.message_bn ?? "ত্রুটি")
          : (e.data?.errors?.details?.message_en ?? "Error"),
      );
    }
  };

  if (isLoading) return <Spinner />;
  if (!pkg) return null;

  const name = localName(pkg.name_bn, pkg.name_en, locale === "bn");
  const desc = locale === "bn" ? pkg.description_bn : pkg.description_en;
  const inStock = Number(pkg.stock_on_hand) > 0;

  const originalTotal =
    pkg.package_items?.reduce(
      (sum, item) =>
        sum + parseFloat(item.unit_price ?? "0") * Number(item.quantity),
      0,
    ) ?? 0;
  const finalPrice = parseFloat(pkg.unit_price);
  const hasDiscount =
    pkg.discount_type !== "NONE" && originalTotal > finalPrice;
  const savings = originalTotal - finalPrice;

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <div className="mb-4">
        <OfferBanners />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left — image */}
        <div>
          {pkg.images.length > 0 ? (
            <div className="relative w-full h-80 rounded-xl overflow-hidden border border-gray-100">
              <Image
                src={pkg.images[0].image}
                alt={name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-80 bg-amber-50 rounded-xl flex items-center justify-center text-7xl">
              🎁
            </div>
          )}
        </div>

        {/* Right — info */}
        <div className="space-y-4">
          <div>
            <span className="inline-block text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full mb-2">
              {locale === "bn" ? "প্যাকেজ" : "Package"}
            </span>
            <h1 className="text-2xl font-bold text-gray-800 leading-snug">
              {name}
            </h1>
          </div>

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-amber-600">
              {formatAmount(finalPrice, locale, 0)}
            </span>
            {hasDiscount && (
              <span className="text-base text-gray-500 line-through mb-0.5">
                {formatAmount(originalTotal, locale, 0)}
              </span>
            )}
          </div>

          {hasDiscount && (
            <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-sm font-bold px-3 py-1.5 rounded-lg border border-green-100">
              🎉{" "}
              {locale === "bn"
                ? `${formatAmount(savings, locale, 0)} সাশ্রয়`
                : `Save ${formatAmount(savings, locale, 0)}`}
            </div>
          )}

          {/* Stock */}
          <div>
            {inStock ? (
              <Badge variant="green">{t("product.inStock")}</Badge>
            ) : (
              <Badge variant="red">{t("product.outOfStock")}</Badge>
            )}
          </div>

          {/* Description */}
          {desc && (
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{desc}</p>
          )}

          {/* Add to cart */}
          {inStock && (
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 hover:bg-gray-50 text-gray-600"
                >
                  −
                </button>
                <span className="px-4 py-2 border-x border-gray-200 text-sm font-bold">
                  {formatNumber(qty, locale)}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="px-3 py-2 hover:bg-gray-50 text-gray-600"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="btn-secondary flex-1"
              >
                {adding ? t("common.loading") : t("product.addToCart")}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={adding}
                className="btn-primary flex-1"
              >
                {locale === "bn" ? "এখনই কিনুন" : "Buy Now"}
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 font-bold inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {locale === "bn" ? "আরো কিনুন" : "Shop More"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Package items */}
      {pkg.package_items?.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {locale === "bn" ? "প্যাকেজে যা আছে" : "What's in this package"}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({pkg.package_items.length}{" "}
              {locale === "bn" ? "টি পণ্য" : "items"})
            </span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pkg.package_items.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-lg shrink-0">
                  🪔
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {locale === "bn"
                      ? item.component_name_bn
                      : item.component_name_en}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {item.component_sku}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                  ×{formatNumber(Number(item.quantity), locale)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <ProductReviews productId={id} locale={locale} />
    </div>
  );
}

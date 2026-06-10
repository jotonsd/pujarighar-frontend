"use client";
import { formatAmount, formatNumber, localName } from "@/utils/format";

import { useAddToCartMutation } from "@/api/cart/cartApi";
import { useGetProductQuery } from "@/api/products/productsApi";
import ProductReviews from "@/components/products/ProductReviews";
import Badge from "@/components/ui/Badge";
import OfferBanners from "@/components/products/OfferBanners";
import { ArrowLeft } from "lucide-react";
import { ProductDetailSkeleton } from "@/components/ui/skeletons";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useGuestCartStore } from "@/store/guestCartStore";
import { toast } from "@/store/toastStore";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isAuthenticated } = useAuthStore();
  const setItemCount = useCartStore(s => s.setItemCount);
  const guestAddItem = useGuestCartStore(s => s.addItem);

  const { data: product, isLoading } = useGetProductQuery(params.id);
  const [addToCart, { isLoading: adding }] = useAddToCartMutation();

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push(`/${locale}/cart`);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      guestAddItem({
        product_id:          product.id,
        name_bn:             product.name_bn,
        name_en:             product.name_en,
        unit_price:          String(product.effective_price ?? product.unit_price),
        original_unit_price: String(product.original_price ?? product.unit_price),
        stock:               Number(product.stock_on_hand),
        is_package:          false,
        package_items:       [],
      });
      toast.success(locale === "bn" ? "কার্টে যোগ হয়েছে" : "Added to cart");
      return;
    }
    try {
      const cart = await addToCart({
        product_id: product.id,
        quantity: qty.toFixed(3),
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

  const images = product?.images ?? [];
  const hasMany = images.length > 1;

  // Auto-slide — must be before early returns
  useEffect(() => {
    if (!hasMany) return;
    timerRef.current = setInterval(
      () => setImgIdx(i => (i + 1) % images.length),
      4000,
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasMany, images.length]);

  const goTo = (idx: number) => {
    setImgIdx(idx);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setImgIdx(i => (i + 1) % images.length),
      4000,
    );
  };

  if (isLoading) return <ProductDetailSkeleton />;
  if (!product) return null;

  const name = localName(product.name_bn, product.name_en, locale === "bn");
  const desc =
    locale === "bn" ? product.description_bn : product.description_en;
  const inStock = Number(product.stock_on_hand) > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <div className="mb-4">
        <OfferBanners />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          {/* Main image */}
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative group">
            {images.length > 0 ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[imgIdx].image}
                  alt={
                    locale === "bn"
                      ? images[imgIdx].alt_bn
                      : images[imgIdx].alt_en
                  }
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
                {hasMany && (
                  <>
                    <button
                      onClick={() =>
                        goTo((imgIdx - 1 + images.length) % images.length)
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white text-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => goTo((imgIdx + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white text-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ›
                    </button>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => goTo(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? "bg-white" : "bg-white/40"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                🪔
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {hasMany && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => goTo(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors shrink-0 ${
                    i === imgIdx
                      ? "border-amber-500"
                      : "border-gray-200 hover:border-amber-300"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{name}</h1>
          <div className="flex items-center gap-3 mb-4">
            {(product.brand_name_bn || product.brand_name_en) && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                {localName(product.brand_name_bn ?? '', product.brand_name_en ?? '', locale === 'bn')}
              </span>
            )}
            <p className="text-gray-400 text-sm">SKU: {product.sku}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-3xl font-bold text-amber-600">
              {formatAmount(
                product.active_discount_type
                  ? product.effective_price
                  : product.unit_price,
                locale,
                0,
              )}
            </span>
            {product.active_discount_type && (
              <>
                <span className="text-sm text-gray-400 line-through">
                  {formatAmount(product.unit_price, locale, 0)}
                </span>
                <span className="text-xs font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {product.active_discount_type === "PERCENTAGE"
                    ? `${formatNumber(Number(product.active_discount_value), locale)}% ${locale === "bn" ? "ছাড়" : "OFF"}`
                    : `${formatAmount(Number(product.active_discount_value), locale, 0)} ${locale === "bn" ? "ছাড়" : "OFF"}`}
                </span>
              </>
            )}
            {inStock ? (
              <Badge variant="green">{t("product.inStock")}</Badge>
            ) : (
              <Badge variant="red">{t("product.outOfStock")}</Badge>
            )}
          </div>
          {desc && <p className="text-gray-600 mb-6 leading-relaxed">{desc}</p>}
          {inStock && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 hover:bg-gray-50"
                >
                  −
                </button>
                <span className="px-4 py-2 border-x font-bold">
                  {formatNumber(qty, locale)}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="px-3 py-2 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="btn-secondary flex-1 font-bold"
              >
                {adding ? t("common.loading") : t("product.addToCart")}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={adding}
                className="btn-primary flex-1 font-bold"
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
      <ProductReviews productId={params.id} locale={locale} />
    </div>
  );
}

"use client";
import { calcDiscountedPrice, formatAmount, formatNumber } from "@/utils/format";

import { useAddToCartMutation } from "@/api/cart/cartApi";
import { useGetProductQuery } from "@/api/products/productsApi";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
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
  const [qty, setQty]       = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const timerRef            = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isAuthenticated } = useAuthStore();
  const setItemCount = useCartStore(s => s.setItemCount);
  const guestAddItem = useGuestCartStore(s => s.addItem);

  const { data: product, isLoading } = useGetProductQuery(params.id);
  const [addToCart, { isLoading: adding }] = useAddToCartMutation();

  const handleBuyNow = async () => {
    await handleAddToCart()
    router.push(`/${locale}/cart`)
  }

  const handleAddToCart = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      guestAddItem({
        product_id: product.id,
        name_bn: product.name_bn,
        name_en: product.name_en,
        unit_price: product.unit_price,
        stock: Number(product.stock_on_hand),
        is_package: false,
        package_items: [],
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

  const images  = product?.images ?? [];
  const hasMany = images.length > 1;

  // Auto-slide — must be before early returns
  useEffect(() => {
    if (!hasMany) return;
    timerRef.current = setInterval(() => setImgIdx(i => (i + 1) % images.length), 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [hasMany, images.length]);

  const goTo = (idx: number) => {
    setImgIdx(idx);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setImgIdx(i => (i + 1) % images.length), 4000);
  };

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      <Skeleton className="h-4 w-20 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="flex gap-2">
            {[0, 1, 2].map(i => <Skeleton key={i} className="w-16 h-16 rounded-lg" />)}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <div className="flex gap-3 mt-6">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
  if (!product) return null;

  const name    = locale === "bn" ? product.name_bn : product.name_en;
  const desc    = locale === "bn" ? product.description_bn : product.description_en;
  const inStock = Number(product.stock_on_hand) > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      <button
        onClick={() => router.back()}
        className="text-amber-600 hover:underline mb-6 text-sm"
      >
        ← {t("common.back")}
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          {/* Main image */}
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative group">
            {images.length > 0 ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[imgIdx].image}
                  alt={locale === "bn" ? images[imgIdx].alt_bn : images[imgIdx].alt_en}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
                {hasMany && (
                  <>
                    <button
                      onClick={() => goTo((imgIdx - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white text-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >‹</button>
                    <button
                      onClick={() => goTo((imgIdx + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white text-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >›</button>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => goTo(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/40'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🪔</div>
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
                    i === imgIdx ? 'border-amber-500' : 'border-gray-200 hover:border-amber-300'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{name}</h1>
          <p className="text-gray-500 text-sm mb-4">SKU: {product.sku}</p>
          <div className="flex items-center gap-3 mb-4">
            <div>
              {product.active_discount_type ? (
                <>
                  <span className="text-3xl font-bold text-amber-600">
                    {formatAmount(product.effective_price, locale, 0)}
                  </span>
                  <span className="text-sm text-gray-400 line-through ml-2">
                    {formatAmount(product.unit_price, locale, 0)}
                  </span>
                  <span className="ml-2 text-xs font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                    {product.active_discount_type === 'PERCENTAGE'
                      ? `${product.active_discount_value}% ${locale === 'bn' ? 'ছাড়' : 'OFF'}`
                      : `৳${product.active_discount_value} ${locale === 'bn' ? 'ছাড়' : 'OFF'}`}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-amber-600">
                  {formatAmount(product.unit_price, locale, 0)}
                </span>
              )}
            </div>
            {inStock ? (
              <Badge variant="green">{t("product.inStock")}</Badge>
            ) : (
              <Badge variant="red">{t("product.outOfStock")}</Badge>
            )}
          </div>
          {desc && <p className="text-gray-600 mb-6 leading-relaxed">{desc}</p>}
          {inStock && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 hover:bg-gray-50"
                >
                  −
                </button>
                <span className="px-4 py-2 border-x font-bold">{formatNumber(qty, locale)}</span>
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
                className="btn-secondary flex-1"
              >
                {adding ? t("common.loading") : t("product.addToCart")}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={adding}
                className="btn-primary flex-1"
              >
                {locale === 'bn' ? 'এখনই কিনুন' : 'Buy Now'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

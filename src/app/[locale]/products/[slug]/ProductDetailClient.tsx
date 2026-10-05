"use client";
import { formatAmount, formatNumber, localName } from "@/utils/format";

import { useAddToCartMutation } from "@/api/cart/cartApi";
import { useGetProductQuery } from "@/api/products/productsApi";
import ProductReviews from "@/components/products/ProductReviews";
import RecommendedForYou from "@/components/home/RecommendedForYou";
import Badge from "@/components/ui/Badge";
import { ArrowLeft } from "lucide-react";
import { ProductDetailSkeleton } from "@/components/ui/skeletons";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useGuestCartStore } from "@/store/guestCartStore";
import { toast } from "@/store/toastStore";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

export default function ProductDetailClient({ id, offerBanners }: { id: string; offerBanners: ReactNode }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState<{ bn: string; en: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isAuthenticated } = useAuthStore();
  const setItemCount = useCartStore(s => s.setItemCount);
  const guestAddItem = useGuestCartStore(s => s.addItem);

  const { data: product, isLoading } = useGetProductQuery(id);
  const [addToCart, { isLoading: adding }] = useAddToCartMutation();

  const images = product?.images ?? [];
  // Distinct (bn,en) color pairs — dedup keyed on the pair, not just one
  // language, so a product can't end up with two pills that happen to
  // share an English label but differ in Bangla (or vice versa).
  const colors = Array.from(
    new Map(
      images
        .filter(img => img.color_bn || img.color_en)
        .map(img => [`${img.color_bn}\u0000${img.color_en}`, { bn: img.color_bn, en: img.color_en }]),
    ).values(),
  );
  const colorLabel = (c: { bn: string; en: string }) => (locale === "bn" ? c.bn || c.en : c.en || c.bn);

  // Pre-select the first color (and jump the gallery to its photos) once
  // the product loads, so the customer isn't forced to click a pill for
  // the common case of just wanting the default option — they can still
  // switch colors, this just removes the extra required tap.
  useEffect(() => {
    if (colors.length === 0 || selectedColor) return;
    setSelectedColor(colors[0]);
    const firstIdx = images.findIndex(img => img.color_bn === colors[0].bn && img.color_en === colors[0].en);
    if (firstIdx >= 0) setImgIdx(firstIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push(`/${locale}/cart`);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (colors.length > 0 && !selectedColor) {
      toast.error(locale === "bn" ? "অনুগ্রহ করে একটি রঙ নির্বাচন করুন" : "Please select a color");
      return;
    }
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
        weight_kg:           product.weight_kg,
        color_bn:            selectedColor?.bn ?? "",
        color_en:            selectedColor?.en ?? "",
      });
      toast.success(locale === "bn" ? "কার্টে যোগ হয়েছে" : "Added to cart");
      return;
    }
    try {
      const cart = await addToCart({
        product_id: product.id,
        quantity: qty.toFixed(3),
        color_bn: selectedColor?.bn ?? "",
        color_en: selectedColor?.en ?? "",
      }).unwrap();
      setItemCount(cart.item_count);
      toast.success(locale === "bn" ? "কার্টে যোগ হয়েছে" : "Added to cart");
    } catch (err: unknown) {
      const e = err as {
        data?: {
          errors?: {
            message_bn?: string;
            message_en?: string;
            details?: { message_bn?: string; message_en?: string };
          };
        };
      };
      const errors = e.data?.errors;
      toast.error(
        locale === "bn"
          ? (errors?.message_bn ?? errors?.details?.message_bn ?? "ত্রুটি")
          : (errors?.message_en ?? errors?.details?.message_en ?? "Error"),
      );
    }
  };

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
  const maxStock = Math.max(1, Number(product.stock_on_hand));

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <div className="mb-4">
        {offerBanners}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-3">
          {/* Main image */}
          <div className="aspect-square bg-surface-alt rounded-xl overflow-hidden relative group">
            {images.length > 0 ? (
              <>
                <div
                  className="flex h-full transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(-${imgIdx * 100}%)` }}
                >
                  {images.map((img, i) => (
                    <div key={img.id} className="relative w-full h-full shrink-0">
                      <Image
                        src={img.image}
                        alt={locale === "bn" ? img.alt_bn : img.alt_en}
                        fill
                        priority={i === 0}
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 610px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                {hasMany && (
                  <>
                    <button
                      onClick={() =>
                        goTo((imgIdx - 1 + images.length) % images.length)
                      }
                      aria-label={locale === "bn" ? "আগের ছবি" : "Previous image"}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white text-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => goTo((imgIdx + 1) % images.length)}
                      aria-label={locale === "bn" ? "পরের ছবি" : "Next image"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white text-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ›
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => goTo(i)}
                          aria-label={locale === "bn" ? `ছবি ${i + 1} দেখুন` : `View image ${i + 1}`}
                          aria-current={i === imgIdx}
                          className="w-6 h-6 flex items-center justify-center shrink-0"
                        >
                          <span className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? "bg-surface" : "bg-surface/40"}`} />
                        </button>
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
                  aria-label={locale === "bn" ? `ছবি ${i + 1} দেখুন` : `View image ${i + 1}`}
                  aria-current={i === imgIdx}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors shrink-0 ${
                    i === imgIdx
                      ? "border-amber-500"
                      : "border-border hover:border-amber-300"
                  }`}
                >
                  <Image
                    src={img.image}
                    alt={locale === "bn" ? img.alt_bn : img.alt_en}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-body mb-2">{name}</h1>
          <div className="flex items-center gap-3 mb-4">
            {(product.brand_name_bn || product.brand_name_en) && (
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
                {localName(product.brand_name_bn ?? '', product.brand_name_en ?? '', locale === 'bn')}
              </span>
            )}
            <p className="text-muted text-sm">SKU: {product.sku}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-3xl font-bold text-amber-700 dark:text-amber-400">
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
                <span className="text-sm text-muted line-through">
                  {formatAmount(product.unit_price, locale, 0)}
                </span>
                <span className="text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full">
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
          {colors.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-body mb-2">
                {locale === "bn" ? "রঙ নির্বাচন করুন" : "Select Color"}
                {!selectedColor && <span className="text-red-500"> *</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map(color => (
                  <button
                    key={`${color.bn}\u0000${color.en}`}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color);
                      const firstIdx = images.findIndex(img => img.color_bn === color.bn && img.color_en === color.en);
                      if (firstIdx >= 0) goTo(firstIdx);
                    }}
                    className={`px-3.5 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                      selectedColor?.bn === color.bn && selectedColor?.en === color.en
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        : "border-border text-muted hover:border-amber-300"
                    }`}
                  >
                    {colorLabel(color)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {inStock && (
            <div className="flex flex-wrap md:flex-nowrap items-stretch gap-3 mb-6">
              <div className="flex items-center border rounded-lg overflow-hidden shrink-0">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 hover:bg-surface-alt"
                >
                  −
                </button>
                <span className="px-4 py-2 border-x font-bold">
                  {formatNumber(qty, locale)}
                </span>
                <button
                  onClick={() => setQty(Math.min(maxStock, qty + 1))}
                  disabled={qty >= maxStock}
                  className="px-3 py-2 hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="btn-secondary bg-surface-alt hover:bg-border flex-1 min-w-[45%] md:min-w-0 font-bold"
              >
                {adding ? t("common.loading") : t("product.addToCart")}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={adding}
                className="btn-primary flex-1 min-w-[45%] md:min-w-0 font-bold"
              >
                {locale === "bn" ? "এখনই কিনুন" : "Buy Now"}
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 min-w-[45%] md:min-w-0 font-bold inline-flex items-center justify-center gap-1.5 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {locale === "bn" ? "আরো কিনুন" : "Shop More"}
              </button>
            </div>
          )}
          {desc && <p className="text-muted mb-6 leading-relaxed whitespace-pre-line">{desc}</p>}
        </div>
      </div>
      <ProductReviews productId={id} locale={locale} />
      <RecommendedForYou />
    </div>
  );
}

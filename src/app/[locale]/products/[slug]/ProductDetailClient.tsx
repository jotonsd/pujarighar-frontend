"use client";
import { formatAmount, formatNumber, localName } from "@/utils/format";

import { useAddToCartMutation } from "@/api/cart/cartApi";
import { useGetProductQuery } from "@/api/products/productsApi";
import ProductReviews from "@/components/products/ProductReviews";
import RecommendedForYou from "@/components/home/RecommendedForYou";
import VariantPillPicker from "@/components/products/VariantPillPicker";
import { useVariantSelection } from "@/hooks/useVariantSelection";
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isAuthenticated } = useAuthStore();
  const setItemCount = useCartStore(s => s.setItemCount);
  const guestAddItem = useGuestCartStore(s => s.addItem);

  const { data: product, isLoading } = useGetProductQuery(id);
  const [addToCart, { isLoading: adding }] = useAddToCartMutation();
  const selection = useVariantSelection(product);

  const images = product?.images ?? [];

  // Gallery/variant pill unification: when the product's photos are
  // organized by one of the variant attribute types (almost always
  // Color), picking a value for that type also jumps the gallery to the
  // first photo tagged with it — one pill-row does double duty, not two
  // redundant "Color" rows.
  useEffect(() => {
    if (!product?.visual_attribute_type_code) return;
    const valueId = selection.selected[product.visual_attribute_type_code];
    if (!valueId) return;
    const idx = images.findIndex(img => img.visual_value === valueId);
    if (idx >= 0) setImgIdx(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.visual_attribute_type_code, selection.selected]);

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push(`/${locale}/cart`);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (selection.hasVariants && !selection.isComplete) {
      toast.error(locale === "bn" ? "অনুগ্রহ করে একটি বিকল্প নির্বাচন করুন" : "Please select an option");
      return;
    }
    if (selection.hasVariants && !selection.resolvedVariant) {
      toast.error(locale === "bn" ? "স্টক নেই" : "Out of stock");
      return;
    }
    const variant = selection.resolvedVariant;
    const effectivePrice = variant ? variant.effective_price : (product.effective_price ?? product.unit_price);
    const originalPrice  = variant ? (variant.price_override ?? product.unit_price) : (product.original_price ?? product.unit_price);
    const stock           = variant ? Number(variant.stock_on_hand) : Number(product.stock_on_hand);
    if (!isAuthenticated) {
      guestAddItem({
        product_id:          product.id,
        name_bn:             product.name_bn,
        name_en:             product.name_en,
        unit_price:          String(effectivePrice),
        original_unit_price: String(originalPrice),
        stock,
        is_package:          false,
        package_items:       [],
        // images[imgIdx] is already the gallery/pill-unification-resolved
        // photo (jumped to match the selected color) — not always index 0.
        image:               images[imgIdx]?.image ?? images[0]?.image,
        weight_kg:           product.weight_kg,
        variant_id:          variant?.id,
        variant_label_bn:    variant?.label_bn,
        variant_label_en:    variant?.label_en,
      });
      toast.success(locale === "bn" ? "কার্টে যোগ হয়েছে" : "Added to cart");
      return;
    }
    try {
      const cart = await addToCart({
        product_id: product.id,
        quantity: qty.toFixed(3),
        ...(variant && { variant_id: variant.id }),
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
  // Auto-advancing would wander off the selected variant's photos into
  // another variant's — only auto-slide for plain multi-image products
  // with no variants to preserve.
  const autoSlideEnabled = hasMany && !selection.hasVariants;

  // Auto-slide — must be before early returns
  useEffect(() => {
    if (!autoSlideEnabled) return;
    timerRef.current = setInterval(
      () => setImgIdx(i => (i + 1) % images.length),
      4000,
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoSlideEnabled, images.length]);

  const goTo = (idx: number) => {
    setImgIdx(idx);
    if (timerRef.current) clearInterval(timerRef.current);
    if (!autoSlideEnabled) return;
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
  const displayStock = selection.resolvedVariant ? Number(selection.resolvedVariant.stock_on_hand) : Number(product.stock_on_hand);
  // While the customer is still picking pills, don't flash a false "out of
  // stock" before every attribute type even has a selection — only once
  // the combination is complete does whether it actually resolves (and has
  // stock) become the real answer, shown immediately rather than only
  // after an Add to Cart click.
  const inStock = selection.hasVariants
    ? (!selection.isComplete ? true : (!!selection.resolvedVariant && displayStock > 0))
    : displayStock > 0;
  const maxStock = Math.max(1, displayStock);
  const displayEffectivePrice = selection.resolvedVariant ? selection.resolvedVariant.effective_price : (product.active_discount_type ? product.effective_price : product.unit_price);

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
                        quality={70}
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
                    quality={70}
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
              {formatAmount(displayEffectivePrice, locale, 0)}
            </span>
            {product.active_discount_type && (
              <>
                <span className="text-sm text-muted line-through">
                  {formatAmount(selection.resolvedVariant?.price_override ?? product.unit_price, locale, 0)}
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
          {selection.hasVariants && (
            <div className="mb-5">
              <VariantPillPicker selection={selection} locale={locale} />
              {selection.isComplete && !selection.resolvedVariant && (
                <p className="text-xs text-red-500 mt-2">
                  {locale === "bn" ? "স্টক নেই" : "Out of stock"}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap md:flex-nowrap items-stretch gap-3 mb-6">
            <div className="flex items-center border rounded-lg overflow-hidden shrink-0">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={!inStock}
                className="px-3 py-2 hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                −
              </button>
              <span className="px-4 py-2 border-x font-bold">
                {formatNumber(qty, locale)}
              </span>
              <button
                onClick={() => setQty(Math.min(maxStock, qty + 1))}
                disabled={!inStock || qty >= maxStock}
                className="px-3 py-2 hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!inStock || adding}
              className="btn-secondary bg-surface-alt hover:bg-border flex-1 min-w-[45%] md:min-w-0 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? t("common.loading") : !inStock ? t("product.outOfStock") : t("product.addToCart")}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!inStock || adding}
              className="btn-primary flex-1 min-w-[45%] md:min-w-0 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
          {desc && <p className="text-muted mb-6 leading-relaxed whitespace-pre-line">{desc}</p>}
        </div>
      </div>
      <ProductReviews productId={id} locale={locale} />
      <RecommendedForYou />
    </div>
  );
}

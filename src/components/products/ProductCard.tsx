"use client";

import { useAddToCartMutation } from "@/api/cart/cartApi";
import { Product, ProductVariant } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useGuestCartStore } from "@/store/guestCartStore";
import { toast } from "@/store/toastStore";
import OfferBadge from "@/components/ui/OfferBadge";
import ProductBadges from "@/components/products/ProductBadges";
import VariantSelectModal from "@/components/products/VariantSelectModal";
import { useVariantSelection } from "@/hooks/useVariantSelection";
import { formatAmount, formatNumber, localName } from "@/utils/format";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Props {
  product: Product;
  locale: string;
  priority?: boolean;
  sizes?: string;
}

export default function ProductCard({
  product,
  locale,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw",
}: Props) {
  const t = useTranslations();
  const [qty, setQty] = useState(1);
  const [localAdding, setLocalAdding] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const images = product.images ?? [];
  const hasMany = images.length > 1;
  const selection = useVariantSelection(product);

  useEffect(() => {
    // Auto-rotation only conflicts with a variant pill tap when the
    // product's gallery is actually DRIVEN by a variant value (its
    // visual_attribute_type, e.g. Color) — a size-only variant product
    // with no such link has nothing for a timer to fight, so it should
    // still auto-rotate like any other multi-image product.
    if (!hasMany || (selection.hasVariants && product.visual_attribute_type_code)) return;
    timerRef.current = setInterval(() => {
      setImgIdx(i => (i + 1) % images.length);
    }, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasMany, images.length, selection.hasVariants, product.visual_attribute_type_code]);

  // Gallery/variant pill unification — same as the product detail page:
  // picking a value of the product's visual attribute type also jumps the
  // gallery to that value's photo.
  useEffect(() => {
    if (!product.visual_attribute_type_code) return;
    const valueId = selection.selected[product.visual_attribute_type_code];
    if (!valueId) return;
    const idx = images.findIndex(img => img.visual_value === valueId);
    if (idx >= 0) setImgIdx(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.visual_attribute_type_code, selection.selected]);

  const goTo = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIdx(idx);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setImgIdx(i => (i + 1) % images.length),
      3000,
    );
  };

  const name = localName(product.name_bn, product.name_en, locale === "bn");
  const displayStock = selection.resolvedVariant ? Number(selection.resolvedVariant.stock_on_hand) : Number(product.stock_on_hand);
  const inStock = selection.hasVariants
    ? (!selection.isComplete ? true : (!!selection.resolvedVariant && displayStock > 0))
    : displayStock > 0;
  const maxStock = Math.max(1, displayStock);

  const _orig     = parseFloat(String(product.unit_price));
  const _eff      = parseFloat(String(product.effective_price));
  const offerDiff = product.active_discount_type && _eff < _orig ? Math.round(_orig - _eff) : 0;
  const offerPct  = product.active_discount_type && _orig > 0   ? Math.round((_orig - _eff) / _orig * 100) : 0;

  const { isAuthenticated } = useAuthStore();
  const guestAddItem = useGuestCartStore(s => s.addItem);
  const setItemCount = useCartStore(s => s.setItemCount);

  const [addToCart, { isLoading: apiAdding }] = useAddToCartMutation();
  const adding = localAdding || apiAdding;
  const [showVariantModal, setShowVariantModal] = useState(false);

  const dec = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQty(q => Math.max(1, q - 1));
  };
  const inc = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQty(q => Math.min(maxStock, q + 1));
  };

  // Resolves the gallery photo for whichever variant is actually being
  // added — `imgIdx` only tracks the card's OWN pill/carousel state, which
  // the variant modal never touches (it keeps its own separate selection),
  // so a variant confirmed there without ever interacting with the card's
  // carousel would otherwise add with whatever stale photo imgIdx is on.
  const resolveImageForVariant = (variant: ProductVariant | null) => {
    if (variant && product.visual_attribute_type_code) {
      const value = variant.attribute_values.find(
        av => av.attribute_type_code === product.visual_attribute_type_code,
      );
      if (value) {
        const matched = images.find(img => img.visual_value === value.value_id);
        if (matched) return matched.image;
      }
    }
    return images[imgIdx]?.image ?? images[0]?.image;
  };

  const addToCartCore = async (variant: ProductVariant | null, quantity: number) => {
    const effectivePrice = variant ? variant.effective_price : (product.effective_price ?? product.unit_price);
    const originalPrice  = variant ? (variant.price_override ?? product.unit_price) : (product.original_price ?? product.unit_price);
    const stock          = variant ? Number(variant.stock_on_hand) : Number(product.stock_on_hand);

    if (!isAuthenticated) {
      setLocalAdding(true);
      guestAddItem(
        {
          product_id:          product.id,
          name_bn:             product.name_bn,
          name_en:             product.name_en,
          unit_price:          String(effectivePrice),
          original_unit_price: String(originalPrice),
          stock,
          is_package:          false,
          package_items:       [],
          image:               resolveImageForVariant(variant),
          weight_kg:           product.weight_kg,
          variant_id:          variant?.id,
          variant_label_bn:    variant?.label_bn,
          variant_label_en:    variant?.label_en,
        },
        quantity,
      );
      toast.success(locale === "bn" ? "কার্টে যোগ হয়েছে" : "Added to cart");
      setLocalAdding(false);
      return;
    }

    try {
      const cart = await addToCart({
        product_id: product.id,
        quantity: quantity.toFixed(3),
        ...(variant && { variant_id: variant.id }),
      }).unwrap();
      setItemCount(cart.item_count);
      toast.success(locale === "bn" ? "কার্টে যোগ হয়েছে" : "Added to cart");
    } catch {
      toast.error(locale === "bn" ? "যোগ করা যায়নি" : "Failed to add to cart");
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || adding) return;
    // Variant-bearing products pick their combination (and quantity) in
    // the modal instead of the card's own compact controls — there's no
    // room for a full pill row per attribute type on a small card.
    if (selection.hasVariants) {
      setShowVariantModal(true);
      return;
    }
    addToCartCore(null, qty);
    setQty(1);
  };

  const handleModalConfirm = async (variant: ProductVariant, quantity: number) => {
    await addToCartCore(variant, quantity);
    setShowVariantModal(false);
    setQty(1);
  };

  return (
    <div className="relative h-full">
      {offerDiff > 0 && (
        <OfferBadge
          discountType={product.active_discount_type ?? ''}
          pct={offerPct}
          diff={offerDiff}
          locale={locale}
          className="absolute top-1 right-1 z-10"
        />
      )}
    <div className="card hover:shadow-md transition-shadow group flex flex-col p-0 overflow-hidden h-full">
      <Link
        href={`/${locale}/products/${product.slug}`}
        className="block p-4 flex-1"
      >
        <div className="relative mb-4">
          <div className="aspect-square bg-amber-50 rounded-lg overflow-hidden relative">
          <ProductBadges badges={product.badges} locale={locale} />
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
                      priority={priority && i === 0}
                      sizes={sizes}
                      quality={70}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              {/* Prev / Next arrows */}
              {hasMany && (
                <>
                  <button
                    onClick={e =>
                      goTo(e, (imgIdx - 1 + images.length) % images.length)
                    }
                    aria-label={locale === "bn" ? "আগের ছবি" : "Previous image"}
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ‹
                  </button>
                  <button
                    onClick={e => goTo(e, (imgIdx + 1) % images.length)}
                    aria-label={locale === "bn" ? "পরের ছবি" : "Next image"}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ›
                  </button>
                  {/* Dots — 24x24 tap target with a small visual dot centered inside, per touch-target a11y guidance */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={e => goTo(e, i)}
                        aria-label={locale === "bn" ? `ছবি ${i + 1} দেখুন` : `View image ${i + 1}`}
                        aria-current={i === imgIdx}
                        className="w-6 h-6 flex items-center justify-center shrink-0"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? "bg-white" : "bg-white/40"}`} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl group-hover:bg-amber-100 transition-colors">
              🪔
            </div>
          )}
          </div>
        </div>
        <h3 className="font-medium text-body mb-1 line-clamp-2 text-sm">
          {name}
        </h3>
        {/* {product.review_count > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={`text-xs ${s <= Math.round(product.average_rating ?? 0) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
              ))}
            </span>
            <span className="text-xs text-gray-400">({product.review_count.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')})</span>
          </div>
        )} */}
        <p className="text-xs text-muted mb-2">SKU: {product.sku}</p>
        <div className="flex items-center justify-between">
          <div>
            {product.active_discount_type && parseFloat(String(product.effective_price)) < parseFloat(String(product.unit_price)) ? (
              <>
                <span className="text-amber-700 font-bold">
                  {formatAmount(selection.resolvedVariant?.effective_price ?? product.effective_price, locale, 0)}
                </span>
                <span className="text-xs text-muted line-through ml-1.5">
                  {formatAmount(selection.resolvedVariant?.price_override ?? product.unit_price, locale, 0)}
                </span>
              </>
            ) : (
              <span className="text-amber-700 font-bold">
                {formatAmount(selection.resolvedVariant?.effective_price ?? product.effective_price ?? product.unit_price, locale, 0)}
              </span>
            )}
          </div>
          <span className={`badge text-xs ${inStock ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
            {locale === "bn" ? "স্টক" : "Stock"}
          </span>
        </div>
      </Link>

      <div className="px-3 pb-3">
        <div className="flex items-center gap-1">
          {inStock && (
            <>
              <button
                onClick={dec}
                disabled={qty <= 1}
                className="w-6 h-6 rounded bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 font-bold text-sm flex items-center justify-center transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-50 dark:disabled:hover:bg-amber-900/30"
              >
                −
              </button>
              <span className="w-5 text-center text-xs font-bold text-body shrink-0">
                {formatNumber(qty, locale)}
              </span>
              <button
                onClick={inc}
                disabled={qty >= maxStock}
                title={qty >= maxStock ? (locale === "bn" ? "সর্বোচ্চ স্টক সীমা" : "Max stock reached") : undefined}
                className="w-6 h-6 rounded bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 font-bold text-sm flex items-center justify-center transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-50 dark:disabled:hover:bg-amber-900/30"
              >
                +
              </button>
            </>
          )}
          <button
            onClick={handleAddToCart}
            disabled={!inStock || adding}
            className={`flex-1 h-6 rounded text-[10px] font-bold transition-colors ${
              inStock
                ? "bg-amber-600 hover:bg-amber-600 active:bg-amber-700 text-white"
                : "bg-surface-alt text-muted cursor-not-allowed"
            }`}
          >
            {adding
              ? "..."
              : inStock
                ? (locale === "bn" ? "কার্টে যোগ" : "Add to Cart")
                : t("product.outOfStock")}
          </button>
        </div>
      </div>
    </div>
    {showVariantModal && (
      <VariantSelectModal
        product={product}
        locale={locale}
        initialQty={qty}
        onClose={() => setShowVariantModal(false)}
        onConfirm={handleModalConfirm}
        confirmLoading={adding}
      />
    )}
    </div>
  );
}

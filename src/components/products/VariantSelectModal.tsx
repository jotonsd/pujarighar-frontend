"use client";

import { Product, ProductVariant } from "@/lib/types";
import { useVariantSelection } from "@/hooks/useVariantSelection";
import VariantPillPicker from "@/components/products/VariantPillPicker";
import { formatAmount, formatNumber, localName } from "@/utils/format";
import { useEffect, useState } from "react";

interface Props {
  product: Product;
  locale: string;
  onClose: () => void;
  onConfirm: (variant: ProductVariant, qty: number) => void;
  confirmLabel?: string;
  confirmLoading?: boolean;
  // Seeds the modal's quantity from whatever the card's own stepper was
  // already set to, so picking a variant doesn't reset a quantity the
  // customer picked before opening the modal.
  initialQty?: number;
}

// Shared by the Home/Shop product cards and POS's product grid — rather
// than squeezing a full attribute picker onto a small card, clicking
// "Add to Cart" on a variant-bearing product opens this modal instead,
// where there's room for every pill-row plus a quantity stepper.
export default function VariantSelectModal({ product, locale, onClose, onConfirm, confirmLabel, confirmLoading, initialQty = 1 }: Props) {
  const isBn = locale === "bn";
  const selection = useVariantSelection(product);
  const [qty, setQty] = useState(initialQty);

  const variant = selection.resolvedVariant;
  const stock = variant ? Number(variant.stock_on_hand) : 0;
  const maxQty = Math.max(1, stock);
  const canConfirm = selection.isComplete && !!variant && stock > 0;
  const name = localName(product.name_bn, product.name_en, isBn);

  // Gallery/variant pill unification, same as the product detail page:
  // once the product's photos are organized by one of the variant
  // attribute types (almost always Color), picking that pill also swaps
  // the thumbnail shown here to the matching photo.
  const visualValueId = product.visual_attribute_type_code ? selection.selected[product.visual_attribute_type_code] : undefined;
  const displayImage = (visualValueId && product.images.find(img => img.visual_value === visualValueId)?.image)
    ?? product.images?.[0]?.image;

  // The initial qty came from the card's stepper, capped against whatever
  // that variant's stock turned out to be — switching to a lower-stock
  // variant inside the modal shouldn't leave qty silently over the cap.
  useEffect(() => {
    if (qty > maxQty) setQty(maxQty);
  }, [maxQty, qty]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          {displayImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayImage}
              alt=""
              className="w-14 h-14 rounded-lg object-cover border border-border shrink-0"
            />
          )}
          <div className="min-w-0">
            <h2 className="text-base font-bold text-body truncate">{name}</h2>
            <p className="text-xs text-muted">SKU: {product.sku}</p>
          </div>
        </div>

        <VariantPillPicker selection={selection} locale={locale} />

        {selection.isComplete && !variant && (
          <p className="text-xs text-red-500">
            {isBn ? "স্টক নেই" : "Out of stock"}
          </p>
        )}

        {variant && (
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
              {formatAmount(variant.effective_price, locale, 0)}
            </span>
            <span className={`text-xs font-medium ${stock > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {stock > 0
                ? (isBn ? `স্টক: ${formatNumber(stock, locale)}` : `Stock: ${stock}`)
                : (isBn ? "স্টক নেই" : "Out of stock")}
            </span>
          </div>
        )}

        {variant && stock > 0 && (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setQty(q => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="w-8 h-8 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center disabled:opacity-40"
            >
              −
            </button>
            <span className="w-8 text-center font-bold">{formatNumber(qty, locale)}</span>
            <button
              type="button"
              onClick={() => setQty(q => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty}
              className="w-8 h-8 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center disabled:opacity-40"
            >
              +
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => variant && onConfirm(variant, qty)}
            disabled={!canConfirm || confirmLoading}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            {confirmLoading ? "..." : confirmLabel ?? (isBn ? "কার্টে যোগ করুন" : "Add to Cart")}
          </button>
          <button type="button" onClick={onClose} className="flex-1 btn-secondary">
            {isBn ? "বাতিল" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

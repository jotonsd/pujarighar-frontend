"use client";

import { useAddToCartMutation } from "@/api/cart/cartApi";
import Badge from "@/components/ui/Badge";
import { Product } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useGuestCartStore } from "@/store/guestCartStore";
import { toast } from "@/store/toastStore";
import { formatAmount, formatNumber, localName } from "@/utils/format";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Props {
  product: Product;
  locale: string;
}

export default function ProductCard({ product, locale }: Props) {
  const t = useTranslations();
  const [qty, setQty] = useState(1);
  const [localAdding, setLocalAdding] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const images = product.images ?? [];
  const hasMany = images.length > 1;

  useEffect(() => {
    if (!hasMany) return;
    timerRef.current = setInterval(() => {
      setImgIdx(i => (i + 1) % images.length);
    }, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasMany, images.length]);

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
  const inStock = Number(product.stock_on_hand) > 0;
  const maxStock = Math.max(1, Number(product.stock_on_hand));

  const { isAuthenticated } = useAuthStore();
  const guestAddItem = useGuestCartStore(s => s.addItem);
  const setItemCount = useCartStore(s => s.setItemCount);

  const [addToCart, { isLoading: apiAdding }] = useAddToCartMutation();
  const adding = localAdding || apiAdding;

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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || adding) return;

    if (!isAuthenticated) {
      setLocalAdding(true);
      guestAddItem(
        {
          product_id: product.id,
          name_bn: product.name_bn,
          name_en: product.name_en,
          unit_price: product.unit_price,
          stock: Number(product.stock_on_hand),
          is_package: false,
          package_items: [],
          image: product.images?.[0]?.image,
        },
        qty,
      );
      toast.success(locale === "bn" ? "কার্টে যোগ হয়েছে" : "Added to cart");
      setQty(1);
      setLocalAdding(false);
      return;
    }

    try {
      const cart = await addToCart({
        product_id: product.id,
        quantity: qty.toFixed(3),
      }).unwrap();
      setItemCount(cart.item_count);
      toast.success(locale === "bn" ? "কার্টে যোগ হয়েছে" : "Added to cart");
      setQty(1);
    } catch {
      toast.error(locale === "bn" ? "যোগ করা যায়নি" : "Failed to add to cart");
    }
  };

  return (
    <div className="card hover:shadow-md transition-shadow group flex flex-col p-0 overflow-hidden">
      <Link
        href={`/${locale}/products/${product.id}`}
        className="block p-4 flex-1"
      >
        <div className="aspect-square bg-amber-50 rounded-lg relative overflow-hidden mb-4">
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
              {/* Prev / Next arrows */}
              {hasMany && (
                <>
                  <button
                    onClick={e =>
                      goTo(e, (imgIdx - 1 + images.length) % images.length)
                    }
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ‹
                  </button>
                  <button
                    onClick={e => goTo(e, (imgIdx + 1) % images.length)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ›
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={e => goTo(e, i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? "bg-white" : "bg-white/40"}`}
                      />
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
        <h3 className="font-medium text-gray-800 mb-1 line-clamp-2 text-sm">
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
        <p className="text-xs text-gray-400 mb-2">SKU: {product.sku}</p>
        <div className="flex items-center justify-between">
          <div>
            {product.active_discount_type ? (
              <>
                <span className="text-amber-600 font-bold">
                  {formatAmount(product.effective_price, locale, 0)}
                </span>
                <span className="text-xs text-gray-400 line-through ml-1.5">
                  {formatAmount(product.unit_price, locale, 0)}
                </span>
              </>
            ) : (
              <span className="text-amber-600 font-bold">
                {formatAmount(product.unit_price, locale, 0)}
              </span>
            )}
          </div>
          {inStock ? (
            <Badge variant="green" className="text-xs">
              {t("product.inStock")}
            </Badge>
          ) : (
            <Badge variant="red" className="text-xs">
              {t("product.outOfStock")}
            </Badge>
          )}
        </div>
      </Link>

      <div className="px-3 pb-3">
        <div className="flex items-center gap-1">
          {inStock && (
            <>
              <button
                onClick={dec}
                className="w-6 h-6 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center transition-colors shrink-0"
              >
                −
              </button>
              <span className="w-5 text-center text-xs font-bold text-gray-800 shrink-0">
                {formatNumber(qty, locale)}
              </span>
              <button
                onClick={inc}
                className="w-6 h-6 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center transition-colors shrink-0"
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
                ? "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {adding
              ? "..."
              : inStock
                ? t("product.addToCart")
                : t("product.outOfStock")}
          </button>
        </div>
      </div>
    </div>
  );
}

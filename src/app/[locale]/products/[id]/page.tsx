"use client";
import { formatAmount } from "@/utils/format";

import { useAddToCartMutation } from "@/api/cart/cartApi";
import { useGetProductQuery } from "@/api/products/productsApi";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useGuestCartStore } from "@/store/guestCartStore";
import { toast } from "@/store/toastStore";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [qty, setQty] = useState(1);

  const { isAuthenticated } = useAuthStore();
  const setItemCount = useCartStore(s => s.setItemCount);
  const guestAddItem = useGuestCartStore(s => s.addItem);

  const { data: product, isLoading } = useGetProductQuery(params.id);
  const [addToCart, { isLoading: adding }] = useAddToCartMutation();

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

  if (isLoading) return <Spinner />;
  if (!product) return null;

  const name = locale === "bn" ? product.name_bn : product.name_en;
  const desc =
    locale === "bn" ? product.description_bn : product.description_en;
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
          {product.images.length > 0 ? (
            product.images.map(img => (
              <div
                key={img.id}
                className="aspect-square bg-gray-100 rounded-xl overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image}
                  alt={locale === "bn" ? img.alt_bn : img.alt_en}
                  className="w-full h-full object-cover"
                />
              </div>
            ))
          ) : (
            <div className="aspect-square bg-amber-50 rounded-xl flex items-center justify-center text-6xl">
              🪔
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{name}</h1>
          <p className="text-gray-500 text-sm mb-4">SKU: {product.sku}</p>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold text-amber-600">
              {formatAmount(product.unit_price, locale, 0)}
            </span>
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
                <span className="px-4 py-2 border-x">{qty}</span>
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
                className="btn-primary flex-1"
              >
                {adding ? t("common.loading") : t("product.addToCart")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

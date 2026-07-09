"use client";

import { useGetCartQuery } from "@/api/cart/cartApi";
import { useAuthStore } from "@/store/authStore";
import { useGuestCartStore } from "@/store/guestCartStore";
import { formatAmount, formatNumber } from "@/utils/format";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface PreviewItem {
  id: string;
  name: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export default function CartPreview({ locale }: { locale: string }) {
  const isBn = locale === "bn";
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const guestItems = useGuestCartStore(s => s.items);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items: PreviewItem[] = isAuthenticated
    ? (cart?.items ?? []).map(i => ({
        id: i.id,
        name: isBn ? i.product_name_bn : i.product_name_en,
        image: i.product_image,
        unitPrice: parseFloat(i.unit_price),
        quantity: parseFloat(i.quantity),
        lineTotal: parseFloat(i.line_total),
      }))
    : mounted
      ? guestItems.map(i => ({
          id: i.product_id,
          name: isBn ? i.name_bn : i.name_en,
          image: i.image ?? null,
          unitPrice: parseFloat(i.unit_price),
          quantity: i.quantity,
          lineTotal: parseFloat(i.unit_price) * i.quantity,
        }))
      : [];

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link href={`/${locale}/cart`} onClick={() => setOpen(false)} className="relative text-gray-600 hover:text-amber-600 block">
        🛒
        {count > 0 && (
          <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {count}
          </span>
        )}
      </Link>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4" />
              {isBn ? "আপনার কার্ট" : "Your Cart"}
              {count > 0 && (
                <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {formatNumber(count, locale)}
                </span>
              )}
            </h3>
          </div>

          {items.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">
              {isBn ? "কার্ট খালি" : "Your cart is empty"}
            </p>
          ) : (
            <>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-2.5 px-4 py-2.5">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="w-11 h-11 object-cover rounded-lg border border-gray-100 shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-lg border border-gray-100 bg-amber-50 flex items-center justify-center text-lg shrink-0">🪔</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {formatNumber(item.quantity, locale)} × {formatAmount(item.unitPrice, locale, 0)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 shrink-0">
                      {formatAmount(item.lineTotal, locale, 0)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-gray-100 space-y-2.5">
                <div className="flex justify-between text-sm font-bold text-gray-800">
                  <span>{isBn ? "সাবটোটাল" : "Subtotal"}</span>
                  <span className="text-amber-600">{formatAmount(subtotal, locale, 0)}</span>
                </div>
                <Link
                  href={`/${locale}/cart`}
                  onClick={() => setOpen(false)}
                  className="block w-full text-center btn-primary py-2 text-sm"
                >
                  {isBn ? "চেকআউট করুন" : "Checkout"}
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

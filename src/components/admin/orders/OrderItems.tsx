"use client";

import { useUpdateOrderItemQuantityMutation } from "@/api/orders/ordersApi";
import { SalesOrder } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { getErrorMessage } from "@/utils/apiError";
import { formatAmount, formatNumber, localName } from "@/utils/format";
import { Check, Pencil, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

interface Props {
  order: SalesOrder;
}

export default function OrderItems({ order }: Props) {
  const t = useTranslations();
  const locale = useLocale();

  const canEditQty = ["PENDING", "CONFIRMED"].includes(order.status) && order.payment_status !== "PAID";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [updateQuantity, { isLoading: saving }] = useUpdateOrderItemQuantityMutation();

  const startEdit = (itemId: string, currentQty: string) => {
    setEditingId(itemId);
    setEditQty(String(Math.round(parseFloat(currentQty))));
  };

  const saveEdit = async (itemId: string) => {
    const qty = Number(editQty);
    if (!qty || qty <= 0) return;
    try {
      await updateQuantity({ id: order.id, item_id: itemId, quantity: qty }).unwrap();
      setEditingId(null);
      toast.success(locale === "bn" ? "পরিমাণ পরিবর্তন হয়েছে" : "Quantity updated");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  return (
    <div className="card">
      <h2 className="font-semibold text-gray-700 mb-4">{t("order.items")}</h2>
      <div className="space-y-3">
        {order.items.map(item => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 flex items-center gap-1.5 flex-wrap">
                {item.is_package && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                    🎁 {locale === "bn" ? "প্যাকেজ" : "Package"}
                  </span>
                )}
                {localName(
                  item.product_name_bn,
                  item.product_name_en,
                  locale === "bn",
                )}
                {editingId === item.id ? (
                  <span className="inline-flex items-center gap-1 ml-1">
                    <input
                      type="number"
                      min="1"
                      value={editQty}
                      onChange={e => setEditQty(e.target.value)}
                      className="w-14 px-1.5 py-0.5 text-xs border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(item.id)}
                      disabled={saving}
                      className="text-green-600 hover:text-green-700 disabled:opacity-40"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ) : (
                  <span className="text-gray-400 ml-1 font-bold inline-flex items-center gap-1">
                    ×{formatNumber(Math.round(parseFloat(item.quantity)), locale)}
                    {canEditQty && (
                      <button
                        onClick={() => startEdit(item.id, item.quantity)}
                        className="text-gray-300 hover:text-amber-700"
                        title={locale === "bn" ? "পরিমাণ সম্পাদনা করুন" : "Edit quantity"}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                )}
              </span>
              <span className="text-right shrink-0">
                {item.original_unit_price && parseFloat(item.original_unit_price) > parseFloat(item.unit_price) ? (
                  <>
                    <span className="block text-xs text-gray-400">
                      <span className="line-through">{formatAmount(item.original_unit_price, locale)}</span>{" "}
                      <span className="text-gray-600">{formatAmount(item.unit_price, locale)}</span>
                    </span>
                    <span className="block font-bold text-gray-800">
                      {formatAmount(item.line_total, locale)}
                    </span>
                    <span className="block text-xs text-green-600 font-bold">
                      − {formatAmount(String((parseFloat(item.original_unit_price) - parseFloat(item.unit_price)) * parseFloat(item.quantity)), locale)} {locale === "bn" ? "ছাড়" : "off"}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block text-xs text-gray-400">{formatAmount(item.unit_price, locale)}</span>
                    <span className="font-bold">{formatAmount(item.line_total, locale)}</span>
                  </>
                )}
              </span>
            </div>
            {item.is_package && item.package_items?.length > 0 && (
              <div className="ml-4 pl-3 border-l-2 border-amber-100 space-y-1">
                {item.package_items.map((pi, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs text-gray-500"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-300 shrink-0" />
                      {localName(
                        pi.component_name_bn,
                        pi.component_name_en,
                        locale === "bn",
                      )}
                      <span className="text-gray-400 font-mono">
                        {pi.component_sku}
                      </span>
                    </span>
                    <span className="text-gray-400 shrink-0 font-bold">
                      ×
                      {formatNumber(
                        Math.round(parseFloat(pi.quantity)),
                        locale,
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <hr className="my-2" />
        <div className="flex justify-between text-sm text-gray-500">
          <span>{locale === "bn" ? "সাবটোটাল" : "Subtotal"}</span>
          <span className="font-bold">
            {formatAmount(
              String(parseFloat(order.subtotal) + parseFloat(order.discount_amount || "0")),
              locale,
            )}
          </span>
        </div>
        {parseFloat(order.discount_amount) > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{locale === "bn" ? "ডিসকাউন্ট" : "Discount"}</span>
            <span className="font-bold">− {formatAmount(order.discount_amount, locale)}</span>
          </div>
        )}
        {parseFloat(order.delivery_charge) > 0 && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>{locale === "bn" ? "ডেলিভারি চার্জ" : "Delivery Charge"}</span>
            <span className="font-bold text-sm">{formatAmount(order.delivery_charge, locale)}</span>
          </div>
        )}
        {parseFloat(order.cashback_used || "0") > 0 && (
          <div className="flex justify-between text-sm text-purple-600">
            <span>{locale === "bn" ? "ক্যাশব্যাক ব্যবহার" : "Cashback Used"}</span>
            <span className="font-bold">− {formatAmount(order.cashback_used, locale)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold">
          <span>{t("order.total")}</span>
          <span className="text-amber-700">
            {formatAmount(order.grand_total, locale)}
          </span>
        </div>
      </div>
    </div>
  );
}

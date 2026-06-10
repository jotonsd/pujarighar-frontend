"use client";

import { SalesOrder } from "@/lib/types";
import { formatAmount, formatNumber, localName } from "@/utils/format";
import { useLocale, useTranslations } from "next-intl";

interface Props {
  order: SalesOrder;
}

export default function OrderItems({ order }: Props) {
  const t = useTranslations();
  const locale = useLocale();

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
                <span className="text-gray-400 ml-1 font-bold">
                  ×{formatNumber(Math.round(parseFloat(item.quantity)), locale)}
                </span>
              </span>
              <span className="text-right shrink-0">
                {item.original_unit_price &&
                  parseFloat(item.original_unit_price) > parseFloat(item.unit_price) && (
                  <span className="block text-xs text-gray-400 line-through">
                    {formatAmount(
                      String(parseFloat(item.original_unit_price) * parseFloat(item.quantity)),
                      locale,
                    )}
                  </span>
                )}
                <span className="font-bold">{formatAmount(item.line_total, locale)}</span>
                {item.original_unit_price &&
                  parseFloat(item.original_unit_price) > parseFloat(item.unit_price) && (
                  <span className="block text-xs text-green-600 font-semibold">
                    − {formatAmount(
                      String(
                        (parseFloat(item.original_unit_price) - parseFloat(item.unit_price)) *
                        parseFloat(item.quantity)
                      ),
                      locale,
                    )} {locale === "bn" ? "ছাড়" : "off"}
                  </span>
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
          <span className="font-bold">{formatAmount(order.subtotal, locale)}</span>
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
        <div className="flex justify-between font-bold">
          <span>{t("order.total")}</span>
          <span className="text-amber-600">
            {formatAmount(order.grand_total, locale)}
          </span>
        </div>
      </div>
    </div>
  );
}

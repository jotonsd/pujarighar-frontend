"use client";

import { useAdjustStockMutation, useGetStockQuery } from "@/api/stock/stockApi";
import { FloatingInput, FloatingSelect } from "@/components/ui/forms";
import { Product } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { formatNumber } from "@/utils/format";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const EMPTY_FORM = {
  movement_type: "PURCHASE",
  quantity: "",
  unit_cost: "",
  unit_price: "",
  note_bn: "",
};

interface Props {
  product: Product;
}

export default function StockAdjustPanel({ product }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const [adjForm, setAdjForm] = useState(EMPTY_FORM);

  const { data: stockData } = useGetStockQuery(product.id);
  const [adjustStock, { isLoading: adjusting }] = useAdjustStockMutation();

  const handleAdjust = async () => {
    if (!adjForm.quantity) return;
    try {
      await adjustStock({
        productId: product.id,
        movement_type: adjForm.movement_type,
        quantity: Number(adjForm.quantity),
        ...(adjForm.movement_type === "PURCHASE" && {
          unit_cost: Number(adjForm.unit_cost),
          ...(adjForm.unit_price && { unit_price: Number(adjForm.unit_price) }),
        }),
        note_bn: adjForm.note_bn,
      }).unwrap();
      setAdjForm(EMPTY_FORM);
      toast.success(locale === "bn" ? "স্টক আপডেট হয়েছে" : "Stock updated");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 text-2xl">
          {locale === "bn" ? product.name_bn : product.name_en}
        </h2>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold text-amber-600">
            {stockData?.stock_on_hand
              ? formatNumber(parseFloat(stockData.stock_on_hand), locale)
              : "..."}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            {locale === "bn" ? "বর্তমান স্টক" : "Current stock"}
          </p>
        </div>
      </div>

      <div className="card space-y-3">
        <h3 className="font-medium text-gray-700">
          {locale === "bn" ? "স্টক সমন্বয়" : "Stock Adjustment"}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <FloatingSelect
            label={locale === "bn" ? "ধরন" : "Type"}
            value={adjForm.movement_type}
            onChange={val => setAdjForm(p => ({ ...p, movement_type: val }))}
          >
            <option value="PURCHASE">ক্রয় / Purchase</option>
            <option value="ADJUSTMENT">সমন্বয় / Adjustment</option>
          </FloatingSelect>
          <FloatingInput
            label={t("product.quantity")}
            type="number"
            value={adjForm.quantity}
            onChange={e =>
              setAdjForm(p => ({ ...p, quantity: e.target.value }))
            }
          />
          {adjForm.movement_type === "PURCHASE" && (
            <>
              <FloatingInput
                label={
                  locale === "bn"
                    ? "ক্রয় মূল্য (প্রতি একক) *"
                    : "Buying Price (per unit) *"
                }
                type="number"
                min="0"
                step="0.01"
                value={adjForm.unit_cost}
                onChange={e =>
                  setAdjForm(p => ({ ...p, unit_cost: e.target.value }))
                }
              />
              <FloatingInput
                label={
                  locale === "bn"
                    ? "বিক্রয় মূল্য (ঐচ্ছিক)"
                    : "Selling Price (optional)"
                }
                type="number"
                min="0"
                step="0.01"
                value={adjForm.unit_price}
                onChange={e =>
                  setAdjForm(p => ({ ...p, unit_price: e.target.value }))
                }
              />
            </>
          )}
          <div className="col-span-2">
            <FloatingInput
              label="নোট (বাংলা)"
              value={adjForm.note_bn}
              onChange={e =>
                setAdjForm(p => ({ ...p, note_bn: e.target.value }))
              }
            />
          </div>
        </div>
        <button
          onClick={handleAdjust}
          disabled={
            !adjForm.quantity ||
            (adjForm.movement_type === "PURCHASE" && !adjForm.unit_cost) ||
            adjusting
          }
          className="btn-primary w-full"
        >
          {adjusting
            ? t("common.loading")
            : locale === "bn"
              ? "সমন্বয় করুন"
              : "Adjust"}
        </button>
      </div>

      {stockData?.movements && (
        <div className="card max-h-64 overflow-auto">
          <h3 className="font-medium text-gray-700 mb-3">
            {locale === "bn" ? "সাম্প্রতিক মুভমেন্ট" : "Recent Movements"}
          </h3>
          {stockData.movements.map(m => (
            <div
              key={m.id}
              className="flex justify-between text-sm py-2 border-b last:border-0"
            >
              <span className="text-gray-600">
                {locale === "bn"
                  ? ((
                      {
                        PURCHASE: "ক্রয়",
                        SALE: "বিক্রয়",
                        RETURN: "ফেরত",
                        ADJUSTMENT: "সমন্বয়",
                      } as Record<string, string>
                    )[m.movement_type] ?? m.movement_type)
                  : m.movement_type}
              </span>
              <span
                className={
                  Number(m.quantity) > 0
                    ? "text-green-600 font-bold"
                    : "text-amber-600 font-bold"
                }
              >
                {Number(m.quantity) > 0 ? "+" : ""}
                {formatNumber(m.quantity, locale)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

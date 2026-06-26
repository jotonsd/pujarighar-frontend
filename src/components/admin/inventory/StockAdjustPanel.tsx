"use client";

import { useAdjustStockMutation, useGetStockQuery } from "@/api/stock/stockApi";
import { useGetSuppliersQuery } from "@/api/suppliers/suppliersApi";
import { FloatingInput, FloatingSelect } from "@/components/ui/forms";
import { Product } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { formatAmount, formatNumber } from "@/utils/format";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const EMPTY_FORM = {
  movement_type: "PURCHASE",
  quantity: "",
  unit_cost: "",
  unit_price: "",
  supplier_id: "",
  supplier_name: "",
  payment_method: "CASH" as "CASH" | "CREDIT",
  note_bn: "",
};

interface Props {
  product: Product;
}

export default function StockAdjustPanel({ product }: Props) {
  const t = useLocale();
  const locale = t;
  const translations = useTranslations();
  const [adjForm, setAdjForm] = useState(EMPTY_FORM);

  const { data: stockData } = useGetStockQuery(product.id);
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const [adjustStock, { isLoading: adjusting }] = useAdjustStockMutation();

  const isBn = locale === "bn";
  const isPurchase = adjForm.movement_type === "PURCHASE";

  const handleAdjust = async () => {
    if (!adjForm.quantity) return;
    try {
      await adjustStock({
        productId: product.id,
        movement_type: adjForm.movement_type,
        quantity: Number(adjForm.quantity),
        ...(isPurchase && {
          unit_cost: Number(adjForm.unit_cost),
          ...(adjForm.unit_price && { unit_price: Number(adjForm.unit_price) }),
          payment_method: adjForm.payment_method,
          ...(adjForm.supplier_id
            ? { supplier_id: adjForm.supplier_id }
            : adjForm.supplier_name
              ? { supplier_name: adjForm.supplier_name }
              : {}),
        }),
        note_bn: adjForm.note_bn,
      }).unwrap();
      setAdjForm(EMPTY_FORM);
      toast.success(isBn ? "স্টক আপডেট হয়েছে" : "Stock updated");
    } catch {
      toast.error(isBn ? "আপডেট ব্যর্থ" : "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 text-2xl">
          {isBn ? product.name_bn : product.name_en}
        </h2>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold text-amber-600">
            {stockData?.stock_on_hand
              ? formatNumber(parseFloat(stockData.stock_on_hand), locale)
              : "..."}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            {isBn ? "বর্তমান স্টক" : "Current stock"}
          </p>
        </div>
      </div>

      <div className="card space-y-3">
        <h3 className="font-medium text-gray-700">
          {isBn ? "স্টক সমন্বয়" : "Stock Adjustment"}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <FloatingSelect
            label={isBn ? "ধরন" : "Type"}
            value={adjForm.movement_type}
            onChange={val => setAdjForm(p => ({ ...p, movement_type: val }))}
          >
            <option value="PURCHASE">ক্রয় / Purchase</option>
            <option value="ADJUSTMENT">সমন্বয় / Adjustment</option>
          </FloatingSelect>
          <FloatingInput
            label={translations("product.quantity")}
            type="number"
            value={adjForm.quantity}
            onChange={e => setAdjForm(p => ({ ...p, quantity: e.target.value }))}
          />

          {isPurchase && (
            <>
              <FloatingInput
                label={isBn ? "ক্রয় মূল্য (প্রতি একক) *" : "Buying Price (per unit) *"}
                type="number"
                min="0"
                step="0.01"
                value={adjForm.unit_cost}
                onChange={e => setAdjForm(p => ({ ...p, unit_cost: e.target.value }))}
              />
              <FloatingInput
                label={isBn ? "বিক্রয় মূল্য (ঐচ্ছিক)" : "Selling Price (optional)"}
                type="number"
                min="0"
                step="0.01"
                value={adjForm.unit_price}
                onChange={e => setAdjForm(p => ({ ...p, unit_price: e.target.value }))}
              />

              {/* Payment method */}
              <FloatingSelect
                label={isBn ? "পেমেন্ট পদ্ধতি" : "Payment Method"}
                value={adjForm.payment_method}
                onChange={val => setAdjForm(p => ({ ...p, payment_method: val as "CASH" | "CREDIT" }))}
              >
                <option value="CASH">{isBn ? "নগদ" : "Cash"}</option>
                <option value="CREDIT">{isBn ? "বাকিতে (দেনা)" : "Credit (Payable)"}</option>
              </FloatingSelect>

              {/* Supplier — pick from list or type freeform */}
              <FloatingSelect
                label={isBn ? "নিয়মিত সরবরাহকারী" : "Regular Supplier"}
                value={adjForm.supplier_id}
                onChange={val => setAdjForm(p => ({ ...p, supplier_id: val, supplier_name: "" }))}
                showClearButton={!!adjForm.supplier_id}
                onClear={() => setAdjForm(p => ({ ...p, supplier_id: "" }))}
              >
                <option value="">{isBn ? "নির্বাচন করুন" : "Select supplier"}</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {isBn ? s.name_bn || s.name_en : s.name_en || s.name_bn}
                  </option>
                ))}
              </FloatingSelect>

              {!adjForm.supplier_id && (
                <div className="col-span-2">
                  <FloatingInput
                    label={isBn ? "উড়ন্ত সরবরাহকারীর নাম (ঐচ্ছিক)" : "One-off Supplier Name (optional)"}
                    value={adjForm.supplier_name}
                    onChange={e => setAdjForm(p => ({ ...p, supplier_name: e.target.value }))}
                  />
                </div>
              )}

              {/* Cost summary */}
              {adjForm.unit_cost && adjForm.quantity && (
                <div className="col-span-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-sm flex justify-between">
                  <span className="text-gray-600">{isBn ? "মোট ক্রয় মূল্য" : "Total Purchase Cost"}</span>
                  <span className="font-bold text-amber-700">
                    {formatAmount(
                      (parseFloat(adjForm.unit_cost) * parseFloat(adjForm.quantity)).toString(),
                      locale,
                      2,
                    )}
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      {adjForm.payment_method === "CREDIT"
                        ? isBn ? "(বাকি)" : "(credit)"
                        : isBn ? "(নগদ)" : "(cash)"}
                    </span>
                  </span>
                </div>
              )}
            </>
          )}

          <div className="col-span-2">
            <FloatingInput
              label="নোট (বাংলা)"
              value={adjForm.note_bn}
              onChange={e => setAdjForm(p => ({ ...p, note_bn: e.target.value }))}
            />
          </div>
        </div>

        <button
          onClick={handleAdjust}
          disabled={!adjForm.quantity || (isPurchase && !adjForm.unit_cost) || adjusting}
          className="btn-primary w-full"
        >
          {adjusting
            ? translations("common.loading")
            : isBn ? "সমন্বয় করুন" : "Adjust"}
        </button>
      </div>

      {stockData?.movements && (
        <div className="card max-h-72 overflow-auto">
          <h3 className="font-medium text-gray-700 mb-3">
            {isBn ? "সাম্প্রতিক মুভমেন্ট" : "Recent Movements"}
          </h3>
          {stockData.movements.map(m => (
            <div key={m.id} className="py-2 border-b last:border-0 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {isBn
                    ? ({ PURCHASE: "ক্রয়", SALE: "বিক্রয়", RETURN: "ফেরত", ADJUSTMENT: "সমন্বয়" } as Record<string, string>)[m.movement_type] ?? m.movement_type
                    : m.movement_type}
                  {m.supplier_display && (
                    <span className="ml-1 text-xs text-amber-600">— {m.supplier_display}</span>
                  )}
                  {m.payment_method === "CREDIT" && m.movement_type === "PURCHASE" && (
                    <span className="ml-1 text-xs text-blue-500">{isBn ? "(বাকি)" : "(credit)"}</span>
                  )}
                </span>
                <span className={Number(m.quantity) > 0 ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>
                  {Number(m.quantity) > 0 ? "+" : ""}
                  {formatNumber(m.quantity, locale)}
                </span>
              </div>
              {m.unit_cost && Number(m.unit_cost) > 0 && m.movement_type === "PURCHASE" && (
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>{isBn ? "ক্রয় মূল্য" : "Cost"}: {formatAmount(m.unit_cost, locale, 2)}</span>
                  <span>{isBn ? "মোট" : "Total"}: {formatAmount(
                    (parseFloat(m.unit_cost) * parseFloat(m.quantity)).toString(), locale, 2,
                  )}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

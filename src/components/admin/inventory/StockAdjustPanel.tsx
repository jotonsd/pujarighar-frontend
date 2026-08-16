"use client";

import { useAdjustStockMutation, useGetStockQuery, useUpdateStockMovementMutation } from "@/api/stock/stockApi";
import { useGetSuppliersQuery } from "@/api/suppliers/suppliersApi";
import { FloatingInput, FloatingSelect } from "@/components/ui/forms";
import { Product, StockMovement } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { getErrorMessage } from "@/utils/apiError";
import { formatAmount, formatNumber } from "@/utils/format";
import { Pencil } from "lucide-react";
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
  const [updateMovement, { isLoading: savingEdit }] = useUpdateStockMovementMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ quantity: "", unit_cost: "", unit_price: "", payment_method: "CASH" as "CASH" | "CREDIT" });

  const isBn = locale === "bn";
  const isPurchase = adjForm.movement_type === "PURCHASE";
  const isSupplierReturn = adjForm.movement_type === "SUPPLIER_RETURN";
  const needsCostAndSupplier = isPurchase || isSupplierReturn;

  const startEditMovement = (m: StockMovement) => {
    setEditingId(m.id);
    setEditForm({
      quantity: String(Math.abs(parseFloat(m.quantity))),
      unit_cost: m.unit_cost,
      unit_price: m.movement_type === "PURCHASE" ? (product.unit_price ?? "") : "",
      payment_method: m.payment_method,
    });
  };

  const handleSaveMovement = async (movementId: string, movementType: string) => {
    try {
      await updateMovement({
        productId: product.id,
        movementId,
        quantity: Number(editForm.quantity),
        payment_method: editForm.payment_method,
        ...(editForm.unit_cost && { unit_cost: Number(editForm.unit_cost) }),
        ...(movementType === "PURCHASE" && editForm.unit_price && { unit_price: Number(editForm.unit_price) }),
      }).unwrap();
      setEditingId(null);
      toast.success(isBn ? "এন্ট্রি সংশোধন হয়েছে" : "Entry corrected");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  const handleAdjust = async () => {
    if (!adjForm.quantity) return;
    try {
      await adjustStock({
        productId: product.id,
        movement_type: adjForm.movement_type,
        quantity: Number(adjForm.quantity),
        ...(needsCostAndSupplier && {
          unit_cost: Number(adjForm.unit_cost),
          ...(isPurchase && adjForm.unit_price && { unit_price: Number(adjForm.unit_price) }),
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
        <div className="flex items-center gap-3">
          {product.images?.[0]?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0].image} alt="" className="w-14 h-14 object-cover rounded-lg border border-gray-100 shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-300 text-xs shrink-0">—</div>
          )}
          <h2 className="font-semibold text-gray-700 text-2xl">
            {isBn ? product.name_bn : product.name_en}
          </h2>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold text-amber-700">
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
            onChange={val => setAdjForm(p => ({
              ...p,
              movement_type: val,
              unit_cost: val === "SUPPLIER_RETURN" && !p.unit_cost ? product.cost_price : p.unit_cost,
            }))}
          >
            <option value="PURCHASE">ক্রয় / Purchase</option>
            <option value="ADJUSTMENT">সমন্বয় / Adjustment</option>
            <option value="SUPPLIER_RETURN">সরবরাহকারীকে ফেরত / Return to Supplier</option>
          </FloatingSelect>
          <FloatingInput
            label={translations("product.quantity")}
            type="number"
            value={adjForm.quantity}
            onChange={e => setAdjForm(p => ({ ...p, quantity: e.target.value }))}
          />

          {needsCostAndSupplier && (
            <>
              <FloatingInput
                label={
                  isPurchase
                    ? (isBn ? "ক্রয় মূল্য (প্রতি একক) *" : "Buying Price (per unit) *")
                    : (isBn ? "ফেরতের মূল্য (প্রতি একক) *" : "Return Value (per unit) *")
                }
                type="number"
                min="0"
                step="0.01"
                value={adjForm.unit_cost}
                onChange={e => setAdjForm(p => ({ ...p, unit_cost: e.target.value }))}
              />
              {isPurchase && (
                <FloatingInput
                  label={isBn ? "বিক্রয় মূল্য (ঐচ্ছিক)" : "Selling Price (optional)"}
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjForm.unit_price}
                  onChange={e => setAdjForm(p => ({ ...p, unit_price: e.target.value }))}
                />
              )}

              {/* Payment method */}
              <FloatingSelect
                label={isBn ? "পেমেন্ট পদ্ধতি" : "Payment Method"}
                value={adjForm.payment_method}
                onChange={val => setAdjForm(p => ({ ...p, payment_method: val as "CASH" | "CREDIT" }))}
              >
                <option value="CASH">{isBn ? "নগদ" : isSupplierReturn ? "Cash Refund" : "Cash"}</option>
                <option value="CREDIT">
                  {isBn
                    ? isSupplierReturn ? "বাকি থেকে বাদ" : "বাকিতে (দেনা)"
                    : isSupplierReturn ? "Deducted from Payable" : "Credit (Payable)"}
                </option>
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
                  <span className="text-gray-600">
                    {isPurchase
                      ? (isBn ? "মোট ক্রয় মূল্য" : "Total Purchase Cost")
                      : (isBn ? "মোট ফেরতের মূল্য" : "Total Return Value")}
                  </span>
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
          disabled={!adjForm.quantity || (needsCostAndSupplier && !adjForm.unit_cost) || adjusting}
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
          {stockData.movements.map(m => {
            const canEdit = m.movement_type === "PURCHASE" || m.movement_type === "SUPPLIER_RETURN";
            const isEditing = editingId === m.id;
            return (
              <div key={m.id} className="py-2 border-b last:border-0 text-sm">
                {isEditing ? (
                  <div className="space-y-2 bg-gray-50 rounded-lg p-2 -mx-1">
                    <div className="grid grid-cols-2 gap-2">
                      <FloatingInput
                        label={translations("product.quantity")}
                        type="number"
                        value={editForm.quantity}
                        onChange={e => setEditForm(p => ({ ...p, quantity: e.target.value }))}
                      />
                      <FloatingInput
                        label={isBn ? "ক্রয় মূল্য (প্রতি একক)" : "Cost (per unit)"}
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.unit_cost}
                        onChange={e => setEditForm(p => ({ ...p, unit_cost: e.target.value }))}
                      />
                      <FloatingSelect
                        label={isBn ? "পেমেন্ট পদ্ধতি" : "Payment Method"}
                        value={editForm.payment_method}
                        onChange={val => setEditForm(p => ({ ...p, payment_method: val as "CASH" | "CREDIT" }))}
                      >
                        <option value="CASH">{isBn ? "নগদ" : "Cash"}</option>
                        <option value="CREDIT">{isBn ? "বাকিতে (দেনা)" : "Credit (Payable)"}</option>
                      </FloatingSelect>
                      {m.movement_type === "PURCHASE" && (
                        <FloatingInput
                          label={isBn ? "বিক্রয় মূল্য (ঐচ্ছিক)" : "Selling Price (optional)"}
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.unit_price}
                          onChange={e => setEditForm(p => ({ ...p, unit_price: e.target.value }))}
                        />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveMovement(m.id, m.movement_type)}
                        disabled={!editForm.quantity || savingEdit}
                        className="btn-primary flex-1 text-sm py-1.5"
                      >
                        {savingEdit
                          ? translations("common.loading")
                          : isBn ? "সংরক্ষণ করুন" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 text-sm py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                      >
                        {isBn ? "বাতিল" : "Cancel"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-gray-600">
                        {isBn
                          ? ({ PURCHASE: "ক্রয়", SALE: "বিক্রয়", RETURN: "ফেরত", ADJUSTMENT: "সমন্বয়", SUPPLIER_RETURN: "সরবরাহকারীকে ফেরত" } as Record<string, string>)[m.movement_type] ?? m.movement_type
                          : ({ SUPPLIER_RETURN: "Return to Supplier" } as Record<string, string>)[m.movement_type] ?? m.movement_type}
                        {m.supplier_display && (
                          <span className="ml-1 text-xs text-amber-700">— {m.supplier_display}</span>
                        )}
                        {m.payment_method === "CREDIT" && (m.movement_type === "PURCHASE" || m.movement_type === "SUPPLIER_RETURN") && (
                          <span className="ml-1 text-xs text-blue-500">{isBn ? "(বাকি)" : "(credit)"}</span>
                        )}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className={Number(m.quantity) > 0 ? "text-green-600 font-bold" : "text-amber-700 font-bold"}>
                          {Number(m.quantity) > 0 ? "+" : ""}
                          {formatNumber(m.quantity, locale)}
                        </span>
                        {canEdit && (
                          <button
                            onClick={() => startEditMovement(m)}
                            className="text-gray-400 hover:text-amber-700"
                            title={isBn ? "সম্পাদনা করুন" : "Edit"}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>
                        {new Date(m.created_at).toLocaleDateString(isBn ? "bn-BD" : "en-US", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {m.unit_cost && Number(m.unit_cost) > 0 && (m.movement_type === "PURCHASE" || m.movement_type === "SUPPLIER_RETURN") && (
                        <span>
                          {isBn ? "ক্রয় মূল্য" : "Cost"}: {formatAmount(m.unit_cost, locale, 2)}
                          {" · "}
                          {isBn ? "মোট" : "Total"}: {formatAmount(
                            (parseFloat(m.unit_cost) * Math.abs(parseFloat(m.quantity))).toString(), locale, 2,
                          )}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

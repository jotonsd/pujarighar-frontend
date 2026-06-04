"use client";

import { useGetProductsQuery } from "@/api/products/productsApi";
import { useAdjustStockMutation, useGetStockQuery } from "@/api/stock/stockApi";
import Badge from "@/components/ui/Badge";
import { FloatingInput, FloatingSelect } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { Product } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { formatNumber } from "@/utils/format";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

export default function InventoryPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [selected, setSelected] = useState<Product | null>(null);
  const [search, setSearch]     = useState('');
  const [adjForm, setAdjForm] = useState({
    movement_type: "PURCHASE",
    quantity: "",
    unit_cost: "",
    unit_price: "",
    note_bn: "",
  });

  const { data: products, isLoading } = useGetProductsQuery({ page_size: 100 });
  const { data: stockData } = useGetStockQuery(selected?.id ?? "", {
    skip: !selected,
  });
  const [adjustStock, { isLoading: adjusting }] = useAdjustStockMutation();

  const handleAdjust = async () => {
    if (!selected || !adjForm.quantity) return;
    try {
      await adjustStock({
        productId: selected.id,
        movement_type: adjForm.movement_type,
        quantity: Number(adjForm.quantity),
        ...(adjForm.movement_type === "PURCHASE" && {
          unit_cost: Number(adjForm.unit_cost),
          ...(adjForm.unit_price && { unit_price: Number(adjForm.unit_price) }),
        }),
        note_bn: adjForm.note_bn,
      }).unwrap();
      setAdjForm({ movement_type: "PURCHASE", quantity: "", unit_cost: "", unit_price: "", note_bn: "" });
      toast.success(locale === "bn" ? "স্টক আপডেট হয়েছে" : "Stock updated");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div>
      <PageHeader title={t("admin.inventory")} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-auto max-h-[70vh]">
          {/* Search */}
          <div className="mb-3">
            <FloatingInput
              label={locale === 'bn' ? 'পণ্য খুঁজুন (নাম বা SKU)' : 'Search product (name or SKU)'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {isLoading ? (
            <TableSkeleton columns={3} rows={8} />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-amber-50 border-b border-amber-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                    {t("product.name")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                    {t("product.stock")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products?.data
                  ?.filter(p => {
                    const q = search.toLowerCase()
                    return !q || p.name_bn.toLowerCase().includes(q) || p.name_en.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
                  })
                  .map(p => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`cursor-pointer transition-colors ${selected?.id === p.id ? "bg-amber-50" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {locale === "bn" ? p.name_bn : p.name_en}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                      {p.sku}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={Number(p.stock_on_hand) > 0 ? "green" : "red"}
                      >
                        {formatNumber(parseFloat(p.stock_on_hand), locale)}
                      </Badge>
                    </td>
                  </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {selected ? (
          <div className="space-y-4">
            <div className="card">
              <h2 className="font-semibold text-gray-700 mb-2">
                {locale === "bn" ? selected.name_bn : selected.name_en}
              </h2>
              <p className="text-3xl font-bold text-amber-600">
                {stockData?.stock_on_hand
                  ? formatNumber(parseFloat(stockData.stock_on_hand), locale)
                  : "..."}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {locale === "bn" ? "বর্তমান স্টক" : "Current stock"}
              </p>
            </div>
            <div className="card space-y-3">
              <h3 className="font-medium text-gray-700">
                {locale === "bn" ? "স্টক সমন্বয়" : "Stock Adjustment"}
              </h3>
              <FloatingSelect
                label={locale === "bn" ? "ধরন" : "Type"}
                value={adjForm.movement_type}
                onChange={val =>
                  setAdjForm(p => ({ ...p, movement_type: val }))
                }
              >
                <option value="PURCHASE">ক্রয় / Purchase</option>
                <option value="ADJUSTMENT">সমন্বয় / Adjustment</option>
              </FloatingSelect>
              <FloatingInput
                label={t("product.quantity")}
                type="number"
                value={adjForm.quantity}
                onChange={e =>
                  setAdjForm({ ...adjForm, quantity: e.target.value })
                }
              />
              {adjForm.movement_type === "PURCHASE" && (
                <>
                  <FloatingInput
                    label={locale === "bn" ? "ক্রয় মূল্য (প্রতি একক) *" : "Buying Price (per unit) *"}
                    type="number"
                    min="0"
                    step="0.01"
                    value={adjForm.unit_cost}
                    onChange={e =>
                      setAdjForm({ ...adjForm, unit_cost: e.target.value })
                    }
                  />
                  <FloatingInput
                    label={locale === "bn" ? "বিক্রয় মূল্য (ঐচ্ছিক)" : "Selling Price (optional)"}
                    type="number"
                    min="0"
                    step="0.01"
                    value={adjForm.unit_price}
                    onChange={e =>
                      setAdjForm({ ...adjForm, unit_price: e.target.value })
                    }
                  />
                </>
              )}
              <FloatingInput
                label="নোট (বাংলা)"
                value={adjForm.note_bn}
                onChange={e =>
                  setAdjForm({ ...adjForm, note_bn: e.target.value })
                }
              />
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
                        ? ({ PURCHASE: "ক্রয়", SALE: "বিক্রয়", RETURN: "ফেরত", ADJUSTMENT: "সমন্বয়" } as Record<string, string>)[m.movement_type] ?? m.movement_type
                        : m.movement_type}
                    </span>
                    <span
                      className={
                        Number(m.quantity) > 0
                          ? "text-green-600"
                          : "text-amber-600"
                      }
                    >
                      {Number(m.quantity) > 0 ? "+" : ""}
                      {m.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="card flex items-center justify-center text-gray-400">
            {locale === "bn" ? "একটি পণ্য নির্বাচন করুন" : "Select a product"}
          </div>
        )}
      </div>
    </div>
  );
}

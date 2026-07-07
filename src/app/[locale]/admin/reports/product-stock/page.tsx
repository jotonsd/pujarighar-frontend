"use client";

import { useGetCategoriesQuery } from "@/api/categories/categoriesApi";
import { useGetProductsQuery } from "@/api/products/productsApi";
import { FloatingSelect } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/skeletons";
import { formatAmount, formatNumber } from "@/utils/format";
import { useLocale } from "next-intl";
import { useState } from "react";

export default function ProductStockReportPage() {
  const locale = useLocale();
  const isBn = locale === "bn";

  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId]   = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: productsRes, isLoading } = useGetProductsQuery({
    page_size: 500,
    category: categoryId || undefined,
  });
  const allProducts = productsRes?.data ?? [];

  const rows = allProducts
    .filter(p => !productId || p.id === productId)
    .filter(p => !onlyLowStock || Number(p.stock_on_hand) <= 5)
    .sort((a, b) => Number(a.stock_on_hand) - Number(b.stock_on_hand));

  const totalStock = rows.reduce((s, p) => s + Number(p.stock_on_hand), 0);
  const totalValue = rows.reduce((s, p) => s + Number(p.stock_on_hand) * Number(p.cost_price), 0);

  return (
    <div>
      <PageHeader
        title={isBn ? "পণ্য স্টক রিপোর্ট" : "Product Stock Report"}
        description={isBn ? "প্রতিটি পণ্যের বর্তমান স্টক ও স্টক মূল্য দেখুন" : "See current stock levels and stock value for every product"}
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <FloatingSelect
          label={isBn ? "কেটাগরি" : "Category"}
          value={categoryId}
          onChange={setCategoryId}
          showClearButton={!!categoryId}
          onClear={() => setCategoryId("")}
          options={categories.map(c => ({ value: c.id, label: isBn ? c.name_bn : c.name_en }))}
        />
        <FloatingSelect
          label={isBn ? "পণ্য" : "Product"}
          value={productId}
          onChange={setProductId}
          showClearButton={!!productId}
          onClear={() => setProductId("")}
          options={allProducts.map(p => ({ value: p.id, label: isBn ? p.name_bn : p.name_en }))}
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 px-1">
          <input
            type="checkbox"
            checked={onlyLowStock}
            onChange={e => setOnlyLowStock(e.target.checked)}
            className="accent-amber-600 w-4 h-4"
          />
          {isBn ? "শুধু কম স্টক (≤৫)" : "Only low stock (≤5)"}
        </label>
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} rows={8} />
      ) : rows.length === 0 ? (
        <p className="text-gray-400 text-sm">{isBn ? "কোনো তথ্য নেই" : "No data found"}</p>
      ) : (
        <div className="card p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "পণ্য" : "Product"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "কেটাগরি" : "Category"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "স্টক" : "Stock"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "ক্রয় মূল্য" : "Cost Price"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "স্টক মূল্য" : "Stock Value"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(p => {
                const stock = Number(p.stock_on_hand);
                const value = stock * Number(p.cost_price);
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-800">
                      <div className="flex items-center gap-2.5">
                        {p.images?.[0]?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0].image} alt="" className="w-9 h-9 object-cover rounded-md border border-gray-100 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-md border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-300 text-xs shrink-0">—</div>
                        )}
                        <div>
                          <div>{isBn ? p.name_bn : p.name_en}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{isBn ? p.category_name_bn : p.category_name_en}</td>
                    <td className={`px-4 py-3 text-right text-xs font-bold ${stock <= 0 ? "text-red-600" : stock <= 5 ? "text-amber-600" : "text-gray-700"}`}>
                      {formatNumber(stock, locale)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600">{formatAmount(p.cost_price, locale, 2)}</td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-amber-600">{formatAmount(value.toString(), locale, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-amber-200 bg-amber-50">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-xs font-bold text-gray-700">{isBn ? "সর্বমোট" : "Total"}</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-gray-800">{formatNumber(totalStock, locale)}</td>
                <td></td>
                <td className="px-4 py-3 text-right text-xs font-bold text-gray-800">{formatAmount(totalValue.toString(), locale, 2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

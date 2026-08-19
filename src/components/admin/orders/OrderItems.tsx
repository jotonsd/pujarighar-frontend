"use client";

import { useAddOrderItemMutation, useDeleteOrderItemMutation, useUpdateOrderItemQuantityMutation } from "@/api/orders/ordersApi";
import { useGetProductsQuery } from "@/api/products/productsApi";
import { Product, SalesOrder } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { getErrorMessage } from "@/utils/apiError";
import { formatAmount, formatNumber, localName } from "@/utils/format";
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Fragment, useState } from "react";
import DeleteItemConfirmModal from "./DeleteItemConfirmModal";

function AddProductPicker({ orderId, locale }: { orderId: string; locale: string }) {
  const isBn = locale === "bn";
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [qty, setQty] = useState("1");
  const [addItem, { isLoading: adding }] = useAddOrderItemMutation();

  const { data: results, isFetching } = useGetProductsQuery(
    { search: query, page_size: 8 },
    { skip: query.trim().length < 2 },
  );

  const handleAdd = async () => {
    if (!selected || !qty || Number(qty) <= 0) return;
    try {
      await addItem({ id: orderId, product_id: selected.id, quantity: Number(qty) }).unwrap();
      toast.success(isBn ? "পণ্য যোগ হয়েছে" : "Product added");
      setSelected(null);
      setQuery("");
      setQty("1");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
      {!selected ? (
        <div className="relative">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder={isBn ? "পণ্য খুঁজুন যোগ করতে..." : "Search product to add..."}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
            />
          </div>
          {open && query.trim().length >= 2 && (
            <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-56 overflow-y-auto">
              {isFetching ? (
                <div className="px-3 py-3 text-sm text-gray-400 text-center">{isBn ? "খুঁজছি..." : "Searching..."}</div>
              ) : results?.data?.length ? (
                results.data.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => { setSelected(p); setOpen(false); setQuery(""); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-amber-50 text-left transition-colors"
                  >
                    {p.images?.[0]?.image ? (
                      <Image src={p.images[0].image} alt="" width={32} height={32} className="w-8 h-8 rounded-md object-cover border border-gray-100 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-md border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-300 text-xs shrink-0">—</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-gray-800">{localName(p.name_bn, p.name_en, isBn)}</div>
                      <div className="text-xs text-gray-400 font-mono">{p.sku}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-amber-700">{formatAmount(p.effective_price, locale)}</div>
                      <div className="text-[11px] text-gray-400">{isBn ? "স্টক" : "Stock"}: {formatNumber(parseFloat(p.stock_on_hand), locale)}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-3 text-sm text-gray-400 text-center">{isBn ? "কোনো পণ্য পাওয়া যায়নি" : "No products found"}</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-2 flex-1 min-w-[160px] px-3 py-2 bg-amber-50 rounded-lg text-sm">
            <span className="truncate">{localName(selected.name_bn, selected.name_en, isBn)}</span>
            <button type="button" onClick={() => setSelected(null)} className="ml-auto text-gray-400 hover:text-gray-600 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="w-20 px-2 py-2 text-sm border border-gray-200 rounded-lg text-center focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            disabled={adding || !qty || Number(qty) <= 0}
            onClick={handleAdd}
            className="btn-primary text-xs whitespace-nowrap inline-flex items-center gap-1 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            {adding ? (isBn ? "যোগ হচ্ছে..." : "Adding...") : (isBn ? "যোগ করুন" : "Add")}
          </button>
        </div>
      )}
    </div>
  );
}

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteItem, { isLoading: deleting }] = useDeleteOrderItemMutation();

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

  const confirmDelete = async (itemId: string) => {
    try {
      await deleteItem({ id: order.id, item_id: itemId }).unwrap();
      setDeletingId(null);
      toast.success(locale === "bn" ? "পণ্য মুছে ফেলা হয়েছে" : "Item removed");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  return (
    <div className="card">
      <h2 className="font-semibold text-gray-700 mb-4">{t("order.items")}</h2>

      <div className="overflow-x-auto -mx-1 mb-1">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left font-medium py-1.5 px-1 w-6">#</th>
              <th className="text-left font-medium py-1.5 px-1">{locale === "bn" ? "পণ্য" : "Product"}</th>
              <th className="text-center font-medium py-1.5 px-1">{locale === "bn" ? "পরিমাণ" : "Qty"}</th>
              <th className="text-right font-medium py-1.5 px-1">{locale === "bn" ? "একক মূল্য" : "Unit Price"}</th>
              <th className="text-right font-medium py-1.5 px-1">{locale === "bn" ? "মোট" : "Total"}</th>
              {canEditQty && <th className="w-12 py-1.5 px-1" />}
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => {
              const discounted = item.original_unit_price && parseFloat(item.original_unit_price) > parseFloat(item.unit_price);
              return (
                <Fragment key={item.id}>
                  <tr className="border-b border-gray-50 last:border-0 align-top">
                    <td className="py-2 px-1 text-gray-400">{idx + 1}</td>
                    <td className="py-2 px-1 text-gray-700">
                      <div className="flex items-start gap-2">
                        {item.product_image ? (
                          <Image
                            src={item.product_image}
                            alt=""
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-300 text-xs shrink-0">
                            —
                          </div>
                        )}
                        <div>
                          {item.is_package && (
                            <span className="inline-block text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium mb-1">
                              🎁 {locale === "bn" ? "প্যাকেজ" : "Package"}
                            </span>
                          )}
                          <div>{localName(item.product_name_bn, item.product_name_en, locale === "bn")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-1 text-center">
                      {editingId === item.id ? (
                        <span className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={editQty}
                            onChange={e => setEditQty(e.target.value)}
                            className="w-14 px-1.5 py-0.5 text-xs border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-400"
                            autoFocus
                          />
                          <button onClick={() => saveEdit(item.id)} disabled={saving} className="text-green-600 hover:text-green-700 disabled:opacity-40">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ) : (
                        <span className="font-bold text-gray-700">
                          {formatNumber(Math.round(parseFloat(item.quantity)), locale)}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-1 text-right">
                      {discounted ? (
                        <>
                          <span className="line-through text-gray-400 mr-1">{formatAmount(item.original_unit_price!, locale)}</span>
                          <span className="text-gray-700">{formatAmount(item.unit_price, locale)}</span>
                        </>
                      ) : (
                        <span className="text-gray-700">{formatAmount(item.unit_price, locale)}</span>
                      )}
                    </td>
                    <td className="py-2 px-1 text-right font-bold text-gray-800">
                      {formatAmount(item.line_total, locale)}
                    </td>
                    {canEditQty && editingId !== item.id && (
                      <td className="py-2 px-1">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => startEdit(item.id, item.quantity)}
                            className="text-gray-300 hover:text-amber-700"
                            title={locale === "bn" ? "পরিমাণ সম্পাদনা করুন" : "Edit quantity"}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {order.items.length > 1 && (
                            <button
                              onClick={() => setDeletingId(item.id)}
                              className="text-gray-300 hover:text-red-600"
                              title={locale === "bn" ? "পণ্য মুছুন" : "Remove item"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                    {canEditQty && editingId === item.id && <td />}
                  </tr>
                  {item.is_package && item.package_items?.length > 0 && (
                    <tr className="border-b border-gray-50 last:border-0">
                      <td />
                      <td colSpan={canEditQty ? 4 : 3} className="pb-2 px-1">
                        <div className="ml-1 pl-3 border-l-2 border-amber-100 space-y-1">
                          {item.package_items.map((pi, i) => (
                            <div key={i} className="flex items-center justify-between text-xs text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-amber-300 shrink-0" />
                                {localName(pi.component_name_bn, pi.component_name_en, locale === "bn")}
                                <span className="text-gray-400 font-mono">{pi.component_sku}</span>
                              </span>
                              <span className="text-gray-400 shrink-0 font-bold">
                                ×{formatNumber(Math.round(parseFloat(pi.quantity)), locale)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {canEditQty && <AddProductPicker orderId={order.id} locale={locale} />}

      <div className="space-y-1.5">
        <hr className="my-2" />
        <div className="flex justify-between text-sm text-gray-500">
          <span>{locale === "bn" ? "পণ্য মূল্য" : "Product Total"}</span>
          <span className="font-bold">
            {formatAmount(
              String(parseFloat(order.subtotal) + parseFloat(order.discount_amount || "0")),
              locale,
            )}
          </span>
        </div>
        {parseFloat(order.discount_amount) > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{locale === "bn" ? "ছাড়" : "Discount"}</span>
            <span className="font-bold">− {formatAmount(order.discount_amount, locale)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-500">
          <span>{locale === "bn" ? "সাবটোটাল" : "Subtotal"}</span>
          <span className="font-bold">{formatAmount(order.subtotal, locale)}</span>
        </div>
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

      {deletingId && (
        <DeleteItemConfirmModal
          locale={locale}
          productName={localName(
            order.items.find(i => i.id === deletingId)?.product_name_bn ?? "",
            order.items.find(i => i.id === deletingId)?.product_name_en ?? "",
            locale === "bn",
          )}
          loading={deleting}
          onCancel={() => setDeletingId(null)}
          onConfirm={() => confirmDelete(deletingId)}
        />
      )}
    </div>
  );
}

'use client'

import { useGetProductsQuery } from '@/api/products/productsApi'
import { Product, SalesOrder } from '@/lib/types'
import { formatAmount, formatNumber, localName } from '@/utils/format'
import { Plus, Search, X } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

interface ReturnedLine {
  checked: boolean
  quantity: string
}

interface ReplacementLine {
  product: Product
  quantity: string
}

function ReplacementPicker({
  locale, onAdd,
}: {
  locale: string
  onAdd: (product: Product) => void
}) {
  const isBn = locale === 'bn'
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const { data: results, isFetching } = useGetProductsQuery(
    { search: query, page_size: 8 },
    { skip: query.trim().length < 2 },
  )

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={isBn ? 'প্রতিস্থাপন পণ্য খুঁজুন...' : 'Search replacement product...'}
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
        />
      </div>
      {open && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-56 overflow-y-auto">
          {isFetching ? (
            <div className="px-3 py-3 text-sm text-gray-400 text-center">{isBn ? 'খুঁজছি...' : 'Searching...'}</div>
          ) : results?.data?.length ? (
            results.data.map(p => (
              <button
                key={p.id}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onAdd(p); setOpen(false); setQuery('') }}
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
                  <div className="text-[11px] text-gray-400">{isBn ? 'স্টক' : 'Stock'}: {formatNumber(parseFloat(p.stock_on_hand), locale)}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-sm text-gray-400 text-center">{isBn ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ExchangeModal({
  order, locale, loading, onCancel, onConfirm,
}: {
  order: SalesOrder
  locale: string
  loading: boolean
  onCancel: () => void
  onConfirm: (payload: {
    returned_items: { item_id: string; quantity: number }[]
    replacement_items: { product_id: string; quantity: number }[]
    delivery_charge_waived: boolean
    discount_type?: 'PERCENTAGE' | 'FLAT'
    discount_value?: number
    note_bn?: string
  }) => void
}) {
  const isBn = locale === 'bn'

  const [returnLines, setReturnLines] = useState<Record<string, ReturnedLine>>(() =>
    Object.fromEntries(order.items.map(i => [i.id, { checked: false, quantity: String(parseFloat(i.quantity)) }])),
  )
  const [replacementLines, setReplacementLines] = useState<ReplacementLine[]>([])
  const [deliveryChargeWaived, setDeliveryChargeWaived] = useState(false)
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState('')
  const [noteBn, setNoteBn] = useState('')

  const toggleReturn = (itemId: string) =>
    setReturnLines(p => ({ ...p, [itemId]: { ...p[itemId], checked: !p[itemId].checked } }))
  const setReturnQty = (itemId: string, value: string) =>
    setReturnLines(p => ({ ...p, [itemId]: { ...p[itemId], quantity: value } }))

  const addReplacement = (product: Product) => {
    setReplacementLines(p => {
      const existing = p.find(l => l.product.id === product.id)
      if (existing) {
        return p.map(l => l.product.id === product.id ? { ...l, quantity: String(parseFloat(l.quantity) + 1) } : l)
      }
      return [...p, { product, quantity: '1' }]
    })
  }
  const setReplacementQty = (productId: string, value: string) =>
    setReplacementLines(p => p.map(l => l.product.id === productId ? { ...l, quantity: value } : l))
  const removeReplacement = (productId: string) =>
    setReplacementLines(p => p.filter(l => l.product.id !== productId))

  const selectedReturns = order.items
    .map(i => ({ item: i, line: returnLines[i.id] }))
    .filter(({ line }) => line.checked)

  const returnedValue = selectedReturns.reduce((sum, { item, line }) => {
    const qty = Math.min(parseFloat(line.quantity) || 0, parseFloat(item.quantity))
    return sum + qty * parseFloat(item.unit_price)
  }, 0)

  const replacementSubtotal = replacementLines.reduce(
    (sum, l) => sum + (parseFloat(l.quantity) || 0) * parseFloat(l.product.effective_price),
    0,
  )

  const numDiscount = Number(discountValue) || 0
  const rawDiscount = discountType === 'PERCENTAGE' ? (replacementSubtotal * numDiscount) / 100 : numDiscount
  const discountAmount = Math.min(Math.max(rawDiscount, 0), replacementSubtotal)
  const estimatedNewTotal = Math.max(0, replacementSubtotal - discountAmount)
  const estimatedNet = estimatedNewTotal - returnedValue

  const isValid =
    selectedReturns.length > 0 &&
    selectedReturns.every(({ item, line }) => {
      const qty = parseFloat(line.quantity)
      return qty > 0 && qty <= parseFloat(item.quantity)
    }) &&
    replacementLines.length > 0 &&
    replacementLines.every(l => (parseFloat(l.quantity) || 0) > 0)

  const handleConfirm = () => {
    if (!isValid) return
    onConfirm({
      returned_items: selectedReturns.map(({ item, line }) => ({ item_id: item.id, quantity: parseFloat(line.quantity) })),
      replacement_items: replacementLines.map(l => ({ product_id: l.product.id, quantity: parseFloat(l.quantity) })),
      delivery_charge_waived: deliveryChargeWaived,
      ...(numDiscount > 0 ? { discount_type: discountType, discount_value: numDiscount } : {}),
      note_bn: noteBn,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔄</span>
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {isBn ? 'পণ্য বিনিময় করুন' : 'Exchange Products'}
            </h2>
            <p className="text-xs text-gray-500">
              {isBn ? 'যে পণ্যগুলো ফেরত নেওয়া হবে তা নির্বাচন করুন' : 'Select the item(s) being returned'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {order.items.map(item => {
            const line = returnLines[item.id]
            return (
              <div key={item.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${line.checked ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
                <input
                  type="checkbox"
                  checked={line.checked}
                  onChange={() => toggleReturn(item.id)}
                  className="w-4 h-4 accent-amber-600 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {isBn ? item.product_name_bn : item.product_name_en || item.product_name_bn}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isBn ? 'অর্ডারকৃত:' : 'Ordered:'} {formatNumber(item.quantity, locale)} · {formatAmount(item.unit_price, locale, 2)} {isBn ? '/একক' : '/unit'}
                  </p>
                </div>
                {line.checked && (
                  <input
                    type="number"
                    min="0"
                    max={item.quantity}
                    step="0.001"
                    value={line.quantity}
                    onChange={e => setReturnQty(item.id, e.target.value)}
                    className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-right focus:outline-none focus:border-amber-500"
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className="pt-2 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {isBn ? 'প্রতিস্থাপন পণ্য' : 'Replacement product(s)'}
          </p>
          <ReplacementPicker locale={locale} onAdd={addReplacement} />
          {replacementLines.length > 0 && (
            <div className="mt-2 space-y-2">
              {replacementLines.map(l => (
                <div key={l.product.id} className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-2 flex-1 min-w-[160px] px-3 py-2 bg-amber-50 rounded-lg text-sm">
                    <span className="truncate">{localName(l.product.name_bn, l.product.name_en, isBn)}</span>
                    <button type="button" onClick={() => removeReplacement(l.product.id)} className="ml-auto text-gray-400 hover:text-gray-600 shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={l.quantity}
                    onChange={e => setReplacementQty(l.product.id, e.target.value)}
                    className="w-20 px-2 py-2 text-sm border border-gray-200 rounded-lg text-center focus:outline-none focus:border-amber-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={deliveryChargeWaived}
            onChange={() => setDeliveryChargeWaived(p => !p)}
            className="w-4 h-4 accent-amber-600"
          />
          {isBn ? 'নতুন ডেলিভারি চার্জ মওকুফ করুন' : 'Waive delivery charge for the replacement'}
        </label>

        <div className="pt-2 border-t border-gray-100 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {isBn ? 'অতিরিক্ত ছাড় (ঐচ্ছিক)' : 'Extra discount (optional)'}
          </p>
          <div className="flex gap-2">
            {(['PERCENTAGE', 'FLAT'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setDiscountType(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  discountType === t
                    ? 'bg-amber-50 border-amber-400 text-amber-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {t === 'PERCENTAGE' ? (isBn ? 'শতকরা (%)' : 'Percentage (%)') : (isBn ? 'নির্দিষ্ট পরিমাণ (৳)' : 'Flat Amount (৳)')}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="0"
            max={discountType === 'PERCENTAGE' ? 100 : undefined}
            value={discountValue}
            onChange={e => setDiscountValue(e.target.value)}
            placeholder={discountType === 'PERCENTAGE' ? (isBn ? 'যেমনঃ ১০' : 'e.g. 10') : (isBn ? 'যেমনঃ ৫০' : 'e.g. 50')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <input
          type="text"
          value={noteBn}
          onChange={e => setNoteBn(e.target.value)}
          placeholder={isBn ? 'নোট (ঐচ্ছিক)' : 'Note (optional)'}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-500"
        />

        {(selectedReturns.length > 0 || replacementLines.length > 0) && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm space-y-1">
            <div className="flex justify-between text-gray-500">
              <span>{isBn ? 'ফেরতের মূল্য (স্টোর ক্রেডিট/ক্যাশ)' : 'Returned value (store credit/cash)'}</span>
              <span className="font-bold text-amber-700">{formatAmount(returnedValue.toString(), locale, 2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>{isBn ? 'প্রতিস্থাপনের মূল্য' : 'Replacement subtotal'}</span>
              <span className="font-bold text-gray-700">{formatAmount(replacementSubtotal.toString(), locale, 2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>{isBn ? 'ছাড়' : 'Discount'}</span>
                <span>−{formatAmount(discountAmount.toString(), locale, 2)}</span>
              </div>
            )}
            <p className="text-[11px] text-gray-400 pt-1">
              {isBn
                ? 'ডেলিভারি চার্জ ও চূড়ান্ত পরিমাণ সার্ভারে গণনা হবে — উপরের হিসাব আনুমানিক।'
                : 'Delivery charge and final amount are computed by the server — the above is an estimate.'}{' '}
              {estimatedNet >= 0
                ? (isBn ? `আনুমানিক প্রদেয়: ৳${estimatedNet.toFixed(2)}` : `Est. amount due: ৳${estimatedNet.toFixed(2)}`)
                : (isBn ? `আনুমানিক ফেরতযোগ্য: ৳${Math.abs(estimatedNet).toFixed(2)}` : `Est. refund/credit remaining: ৳${Math.abs(estimatedNet).toFixed(2)}`)}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading || !isValid}
            className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {loading ? (isBn ? 'প্রক্রিয়া হচ্ছে...' : 'Processing...') : (isBn ? 'বিনিময় নিশ্চিত করুন' : 'Confirm Exchange')}
          </button>
          <button onClick={onCancel} disabled={loading} className="flex-1 btn-secondary">
            {isBn ? 'ফিরে যান' : 'Go Back'}
          </button>
        </div>
      </div>
    </div>
  )
}

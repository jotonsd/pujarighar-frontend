'use client'

import { useState } from 'react'
import { SalesOrder } from '@/lib/types'
import { formatAmount } from '@/utils/format'

interface ReturnedLine {
  checked: boolean
  quantity: string
}

export default function PartialDeliverModal({
  order, locale, loading, onCancel, onConfirm,
}: {
  order: SalesOrder
  locale: string
  loading: boolean
  onCancel: () => void
  onConfirm: (items: { item_id: string; quantity: number }[], noteBn: string) => void
}) {
  const isBn = locale === 'bn'
  const [lines, setLines] = useState<Record<string, ReturnedLine>>(() =>
    Object.fromEntries(order.items.map(i => [i.id, { checked: false, quantity: i.quantity }])),
  )
  const [noteBn, setNoteBn] = useState('')

  const toggle = (itemId: string) =>
    setLines(p => ({ ...p, [itemId]: { ...p[itemId], checked: !p[itemId].checked } }))

  const setQty = (itemId: string, value: string) =>
    setLines(p => ({ ...p, [itemId]: { ...p[itemId], quantity: value } }))

  const selected = order.items
    .map(i => ({ item: i, line: lines[i.id] }))
    .filter(({ line }) => line.checked)

  const returnedValue = selected.reduce((sum, { item, line }) => {
    const qty = Math.min(parseFloat(line.quantity) || 0, parseFloat(item.quantity))
    return sum + qty * parseFloat(item.unit_price)
  }, 0)

  const isValid = selected.length > 0 && selected.every(({ item, line }) => {
    const qty = parseFloat(line.quantity)
    return qty > 0 && qty <= parseFloat(item.quantity)
  })

  const handleConfirm = () => {
    if (!isValid) return
    onConfirm(
      selected.map(({ item, line }) => ({ item_id: item.id, quantity: parseFloat(line.quantity) })),
      noteBn,
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📦</span>
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {isBn ? 'আংশিক ডেলিভারি চিহ্নিত করুন' : 'Mark as Partially Delivered'}
            </h2>
            <p className="text-xs text-gray-500">
              {isBn ? 'যে পণ্যগুলো ফেরত এসেছে সেগুলো নির্বাচন করুন' : 'Select the items that came back'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {order.items.map(item => {
            const line = lines[item.id]
            return (
              <div key={item.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${line.checked ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
                <input
                  type="checkbox"
                  checked={line.checked}
                  onChange={() => toggle(item.id)}
                  className="w-4 h-4 accent-amber-600 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {isBn ? item.product_name_bn : item.product_name_en || item.product_name_bn}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isBn ? 'অর্ডারকৃত:' : 'Ordered:'} {item.quantity} · {formatAmount(item.unit_price, locale, 2)} {isBn ? '/একক' : '/unit'}
                  </p>
                </div>
                {line.checked && (
                  <input
                    type="number"
                    min="0"
                    max={item.quantity}
                    step="0.001"
                    value={line.quantity}
                    onChange={e => setQty(item.id, e.target.value)}
                    className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-right focus:outline-none focus:border-amber-500"
                  />
                )}
              </div>
            )
          })}
        </div>

        <input
          type="text"
          value={noteBn}
          onChange={e => setNoteBn(e.target.value)}
          placeholder={isBn ? 'নোট (ঐচ্ছিক)' : 'Note (optional)'}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-500"
        />

        {selected.length > 0 && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm flex justify-between">
            <span className="text-gray-600">{isBn ? 'ফেরতের মোট মূল্য' : 'Total returned value'}</span>
            <span className="font-bold text-amber-700">{formatAmount(returnedValue.toString(), locale, 2)}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading || !isValid}
            className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {loading ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'নিশ্চিত করুন' : 'Confirm')}
          </button>
          <button onClick={onCancel} disabled={loading} className="flex-1 btn-secondary">
            {isBn ? 'ফিরে যান' : 'Go Back'}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'

export default function ApplyDiscountModal({
  locale, orderNumber, subtotal, deliveryCharge, onConfirm, onCancel, loading,
}: {
  locale: string
  orderNumber: string
  subtotal: number
  deliveryCharge: number
  onConfirm: (discountType: 'PERCENTAGE' | 'FLAT', discountValue: number) => void
  onCancel: () => void
  loading: boolean
}) {
  const isBn = locale === 'bn'
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE')
  const [value, setValue] = useState('')

  const numValue = Number(value) || 0
  const rawDiscount = discountType === 'PERCENTAGE' ? (subtotal * numValue) / 100 : numValue
  const discountAmount = Math.min(Math.max(rawDiscount, 0), subtotal)
  const newSubtotal = subtotal - discountAmount
  const newGrandTotal = newSubtotal + deliveryCharge

  const isValid = numValue > 0 && (discountType !== 'PERCENTAGE' || numValue <= 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏷️</span>
          <h2 className="text-lg font-bold text-gray-800">
            {isBn ? 'ছাড় প্রয়োগ করুন' : 'Apply Discount'}
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          {isBn ? 'অর্ডার নম্বর ' : 'Order '}
          <strong className="text-gray-700">{orderNumber}</strong>
        </p>

        <div className="flex gap-2">
          {(['PERCENTAGE', 'FLAT'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setDiscountType(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
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
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={discountType === 'PERCENTAGE' ? (isBn ? 'যেমনঃ ১০' : 'e.g. 10') : (isBn ? 'যেমনঃ ৫০' : 'e.g. 50')}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-500"
        />

        {numValue > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
            <div className="flex justify-between text-gray-500">
              <span>{isBn ? 'ছাড়' : 'Discount'}</span>
              <span className="text-red-700">−৳{discountAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-800">
              <span>{isBn ? 'নতুন সর্বমোট' : 'New Grand Total'}</span>
              <span>৳{newGrandTotal.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(discountType, numValue)}
            disabled={loading || !isValid}
            className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {loading ? (isBn ? 'প্রয়োগ হচ্ছে...' : 'Applying...') : (isBn ? 'ছাড় প্রয়োগ করুন' : 'Apply Discount')}
          </button>
          <button onClick={onCancel} disabled={loading} className="flex-1 btn-secondary">
            {isBn ? 'ফিরে যান' : 'Go Back'}
          </button>
        </div>
      </div>
    </div>
  )
}

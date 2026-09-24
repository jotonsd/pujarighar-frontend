'use client'

import { useState } from 'react'
import { useGetDeliveryChargesQuery } from '@/api/deliveryCharges/deliveryChargesApi'
import { formatNumber } from '@/utils/format'

type Zone = 'inside' | 'outside'

export default function ChangeDeliveryZoneModal({
  locale, orderNumber, weightKg, currentCharge, onConfirm, onCancel, loading,
}: {
  locale: string
  orderNumber: string
  weightKg: number | null
  currentCharge: number
  onConfirm: (zone: Zone) => void
  onCancel: () => void
  loading: boolean
}) {
  const isBn = locale === 'bn'
  const { data: rates } = useGetDeliveryChargesQuery({ weight: weightKg != null ? String(weightKg) : undefined })
  const inside  = rates?.inside_dhaka_for_weight  ?? rates?.inside_dhaka  ?? '0'
  const outside = rates?.outside_dhaka_for_weight ?? rates?.outside_dhaka ?? '0'
  const [zone, setZone] = useState<Zone>(
    Number(currentCharge) === Number(outside) && Number(outside) !== Number(inside) ? 'outside' : 'inside',
  )

  const options: { value: Zone; label: string; charge: string }[] = [
    { value: 'inside',  label: isBn ? 'ঢাকার ভিতরে' : 'Inside Dhaka',  charge: inside },
    { value: 'outside', label: isBn ? 'ঢাকার বাইরে' : 'Outside Dhaka', charge: outside },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            {isBn ? 'ডেলিভারি অঞ্চল পরিবর্তন' : 'Change Delivery Zone'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isBn
              ? `অর্ডার ${orderNumber} — ডেলিভারি চার্জ ও মোট টাকা নতুন অঞ্চল অনুযায়ী আপডেট হবে।`
              : `Order ${orderNumber} — the delivery charge and total will be recalculated for the new zone.`}
          </p>
        </div>

        <div className="space-y-2">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => setZone(o.value)}
              className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
                zone === o.value
                  ? 'border-amber-500 bg-amber-50 text-amber-800 font-semibold'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{o.label}</span>
              <span className="font-bold">৳{formatNumber(o.charge, locale)}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => onConfirm(zone)} disabled={loading} className="flex-1 btn-primary">
            {loading ? '...' : isBn ? 'পরিবর্তন করুন' : 'Update'}
          </button>
          <button onClick={onCancel} disabled={loading} className="flex-1 btn-secondary">
            {isBn ? 'ফিরে যান' : 'Go Back'}
          </button>
        </div>
      </div>
    </div>
  )
}

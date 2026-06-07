'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Pencil } from 'lucide-react'
import { SalesOrder } from '@/lib/types'
import { FloatingInput } from '@/components/ui/forms'
import { localName } from '@/utils/format'
import { toast } from '@/store/toastStore'
import { useUpdateShippingMutation } from '@/api/orders/ordersApi'

interface Props {
  order: SalesOrder
}

export default function OrderShipping({ order }: Props) {
  const t      = useTranslations()
  const locale = useLocale()
  const isBn   = locale === 'bn'

  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({
    shipping_name_bn:    order.shipping_name_bn,
    shipping_name_en:    order.shipping_name_en,
    shipping_phone:      order.shipping_phone,
    shipping_address_bn: order.shipping_address_bn,
    shipping_district:   order.shipping_district,
    shipping_thana:      order.shipping_thana,
    shipping_post_code:  order.shipping_post_code,
  })

  const [updateShipping, { isLoading: saving }] = useUpdateShippingMutation()

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    try {
      await updateShipping({ id: order.id, ...form }).unwrap()
      toast.success(isBn ? 'ঠিকানা আপডেট হয়েছে' : 'Shipping updated')
      setEditing(false)
    } catch {
      toast.error(isBn ? 'আপডেট ব্যর্থ হয়েছে' : 'Update failed')
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-700">{t('order.shipping')}</h2>
        {!editing && !order.delivery && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors"
          >
            <Pencil className="w-3 h-3" />
            {isBn ? 'সম্পাদনা' : 'Edit'}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FloatingInput
              label={isBn ? 'নাম (বাংলা)' : 'Name (BN)'}
              value={form.shipping_name_bn}
              onChange={f('shipping_name_bn')}
            />
            <FloatingInput
              label={isBn ? 'নাম (ইংরেজি)' : 'Name (EN)'}
              value={form.shipping_name_en}
              onChange={f('shipping_name_en')}
            />
          </div>
          <FloatingInput
            label={isBn ? 'ফোন *' : 'Phone *'}
            value={form.shipping_phone}
            onChange={f('shipping_phone')}
            placeholder="01XXXXXXXXX"
          />
          <FloatingInput
            label={isBn ? 'ঠিকানা' : 'Address'}
            value={form.shipping_address_bn}
            onChange={f('shipping_address_bn')}
          />
          <div className="grid grid-cols-3 gap-3">
            <FloatingInput
              label={isBn ? 'জেলা' : 'District'}
              value={form.shipping_district}
              onChange={f('shipping_district')}
            />
            <FloatingInput
              label={isBn ? 'থানা' : 'Thana'}
              value={form.shipping_thana}
              onChange={f('shipping_thana')}
            />
            <FloatingInput
              label={isBn ? 'পোস্ট কোড' : 'Post Code'}
              value={form.shipping_post_code}
              onChange={f('shipping_post_code')}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm">
              {saving ? (isBn ? 'সংরক্ষণ...' : 'Saving...') : (isBn ? 'সংরক্ষণ করুন' : 'Save')}
            </button>
            <button onClick={() => setEditing(false)} disabled={saving} className="btn-secondary flex-1 text-sm">
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{isBn ? 'নাম' : 'Name'}</p>
            <p className="font-medium text-gray-800">{localName(order.shipping_name_bn, order.shipping_name_en, isBn)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{isBn ? 'ফোন' : 'Phone'}</p>
            <p className="font-medium text-gray-800">{order.shipping_phone}</p>
          </div>
          {(order.shipping_address_bn || order.shipping_address_en) && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-0.5">{isBn ? 'ঠিকানা' : 'Address'}</p>
              <p className="font-medium text-gray-800">{isBn ? order.shipping_address_bn : order.shipping_address_en}</p>
            </div>
          )}
          {order.shipping_district && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-0.5">{isBn ? 'জেলা / থানা / পোস্ট কোড' : 'District / Thana / Post Code'}</p>
              <p className="font-medium text-gray-800">{order.shipping_district}, {order.shipping_thana} — {order.shipping_post_code}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

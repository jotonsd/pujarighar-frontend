'use client'

import { useLocale, useTranslations } from 'next-intl'
import { SalesOrder } from '@/lib/types'

interface Props {
  order: SalesOrder
}

export default function OrderShipping({ order }: Props) {
  const t      = useTranslations()
  const locale = useLocale()

  return (
    <div className="card">
      <h2 className="font-semibold text-gray-700 mb-4">{t('order.shipping')}</h2>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">{locale === 'bn' ? 'নাম' : 'Name'}</p>
          <p className="font-medium text-gray-800">{locale === 'bn' ? order.shipping_name_bn : order.shipping_name_en}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">{locale === 'bn' ? 'ফোন' : 'Phone'}</p>
          <p className="font-medium text-gray-800">{order.shipping_phone}</p>
        </div>
        {(order.shipping_address_bn || order.shipping_address_en) && (
          <div className="col-span-2">
            <p className="text-xs text-gray-400 mb-0.5">{locale === 'bn' ? 'ঠিকানা' : 'Address'}</p>
            <p className="font-medium text-gray-800">{locale === 'bn' ? order.shipping_address_bn : order.shipping_address_en}</p>
          </div>
        )}
        {order.shipping_district && (
          <div className="col-span-2">
            <p className="text-xs text-gray-400 mb-0.5">{locale === 'bn' ? 'জেলা / থানা / পোস্ট কোড' : 'District / Thana / Post Code'}</p>
            <p className="font-medium text-gray-800">{order.shipping_district}, {order.shipping_thana} — {order.shipping_post_code}</p>
          </div>
        )}
      </div>
    </div>
  )
}

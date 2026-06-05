'use client'

import { useLocale } from 'next-intl'
import { Trash2 } from 'lucide-react'
import ToggleSwitch from '@/components/ui/forms/ToggleSwitch'
import { toast } from '@/store/toastStore'
import { useGetDiscountsQuery, useToggleDiscountMutation, useDeleteDiscountMutation } from '@/api/discounts/discountsApi'
import { formatAmount } from '@/utils/format'

export default function DiscountList() {
  const locale = useLocale()
  const isBn   = locale === 'bn'

  const { data: discounts = [], isLoading } = useGetDiscountsQuery({})
  const [toggle] = useToggleDiscountMutation()
  const [remove] = useDeleteDiscountMutation()

  const handleToggle = async (id: string) => {
    try { await toggle(id).unwrap() }
    catch { toast.error('Failed') }
  }

  const handleDelete = async (id: string) => {
    try {
      await remove(id).unwrap()
      toast.success(isBn ? 'মুছে ফেলা হয়েছে' : 'Deleted')
    } catch { toast.error('Failed') }
  }

  if (isLoading) return <div className="card text-center text-gray-400 py-10">{isBn ? 'লোড হচ্ছে...' : 'Loading...'}</div>

  if (discounts.length === 0) return (
    <div className="card text-center text-gray-400 py-10">
      {isBn ? 'কোনো ডিসকাউন্ট নেই' : 'No discounts yet'}
    </div>
  )

  return (
    <div className="space-y-3">
      {discounts.map(d => (
        <div key={d.id} className="card flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 truncate">{isBn ? d.product_name_bn : d.product_name_en}</p>
            <p className="text-xs text-gray-400 font-mono">{d.product_sku}</p>
            <p className="text-sm text-amber-600 font-semibold mt-0.5">
              {d.discount_type === 'PERCENTAGE'
                ? `${d.discount_value}% ${isBn ? 'ছাড়' : 'OFF'}`
                : `${formatAmount(d.discount_value, locale, 0)} ${isBn ? 'ছাড়' : 'OFF'}`}
            </p>
            {d.note && <p className="text-xs text-gray-500 mt-0.5">{d.note}</p>}
            <p className="text-[10px] text-gray-400 mt-0.5">
              {new Date(d.created_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-US')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ToggleSwitch checked={d.is_active} onChange={() => handleToggle(d.id)}
              activeLabel={isBn ? 'সক্রিয়' : 'Active'} inactiveLabel={isBn ? 'নিষ্ক্রিয়' : 'Inactive'} />
            <button onClick={() => handleDelete(d.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

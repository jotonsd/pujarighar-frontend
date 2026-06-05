'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Badge from '@/components/ui/Badge'
import { FloatingInput } from '@/components/ui/forms'
import TableSkeleton from '@/components/ui/skeletons'
import { Product } from '@/lib/types'
import { formatNumber } from '@/utils/format'
import { useGetProductsQuery } from '@/api/products/productsApi'

interface Props {
  selected: Product | null
  onSelect: (p: Product) => void
}

export default function ProductSelector({ selected, onSelect }: Props) {
  const t      = useTranslations()
  const locale = useLocale()
  const [search, setSearch] = useState('')
  const { data: products, isLoading } = useGetProductsQuery({ page_size: 100 })

  return (
    <div className="card p-0 overflow-hidden flex flex-col max-h-[70vh]">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
        <FloatingInput
          label={locale === 'bn' ? 'পণ্য খুঁজুন (নাম বা SKU)' : 'Search product (name or SKU)'}
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <TableSkeleton columns={3} rows={8} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{t('product.name')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{t('product.stock')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products?.data?.filter(p => {
                const q = search.toLowerCase()
                return !q || p.name_bn.toLowerCase().includes(q) || p.name_en.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
              }).map(p => (
                <tr key={p.id} onClick={() => onSelect(p)}
                  className={`cursor-pointer transition-colors ${selected?.id === p.id ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                  <td className="px-4 py-3 text-sm text-gray-800">{locale === 'bn' ? p.name_bn : p.name_en}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{p.sku}</td>
                  <td className="px-4 py-3">
                    <Badge className="font-bold" variant={Number(p.stock_on_hand) > 0 ? 'green' : 'red'}>
                      {formatNumber(parseFloat(p.stock_on_hand), locale)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import { FloatingInput, FloatingSelect } from '@/components/ui/forms'
import TableSkeleton from '@/components/ui/skeletons'
import { Product } from '@/lib/types'
import { formatNumber } from '@/utils/format'
import { useGetProductsQuery } from '@/api/products/productsApi'
import { useGetCategoriesQuery } from '@/api/categories/categoriesApi'
import { useGetBrandsQuery } from '@/api/brands/brandsApi'

interface Props {
  selected: Product | null
  onSelect: (p: Product) => void
}

export default function ProductSelector({ selected, onSelect }: Props) {
  const t      = useTranslations()
  const locale = useLocale()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [page, setPage] = useState(1)

  // 100 is the backend's hard cap per page (see paginate_queryset) — high
  // enough that the current catalog fits on one page, so this list (a picker
  // meant to cover everything stock-manageable, not a paged browse view)
  // doesn't hide products behind pagination clicks unless the catalog
  // genuinely grows past 100, in which case Pagination below still kicks in.
  const { data: products, isLoading } = useGetProductsQuery({
    page, page_size: 100, search,
    category: category || undefined,
    brand: brand || undefined,
    payment_method: paymentMethod || undefined,
  })
  const { data: categories = [] } = useGetCategoriesQuery()
  const { data: brands = [] } = useGetBrandsQuery()

  const resetToFirstPage = () => setPage(1)

  return (
    <div className="card p-0 overflow-hidden flex flex-col max-h-[70vh]">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 shrink-0 space-y-2">
        <FloatingInput
          label={locale === 'bn' ? 'পণ্য খুঁজুন (নাম বা SKU)' : 'Search product (name or SKU)'}
          value={search} onChange={e => { setSearch(e.target.value); resetToFirstPage() }}
        />
        <div className="grid grid-cols-2 gap-2">
          <FloatingSelect
            label={locale === 'bn' ? 'কেটাগরি' : 'Category'}
            value={category}
            onChange={val => { setCategory(val); resetToFirstPage() }}
            showClearButton={!!category}
            onClear={() => { setCategory(''); resetToFirstPage() }}
          >
            <option value="">{locale === 'bn' ? 'সব কেটাগরি' : 'All categories'}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{locale === 'bn' ? c.name_bn : c.name_en}</option>
            ))}
          </FloatingSelect>
          <FloatingSelect
            label={locale === 'bn' ? 'ব্র্যান্ড' : 'Brand'}
            value={brand}
            onChange={val => { setBrand(val); resetToFirstPage() }}
            showClearButton={!!brand}
            onClear={() => { setBrand(''); resetToFirstPage() }}
          >
            <option value="">{locale === 'bn' ? 'সব ব্র্যান্ড' : 'All brands'}</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{locale === 'bn' ? b.name_bn : b.name_en}</option>
            ))}
          </FloatingSelect>
        </div>
        <FloatingSelect
          label={locale === 'bn' ? 'ক্রয়ের ধরন' : 'Purchased With'}
          value={paymentMethod}
          onChange={val => { setPaymentMethod(val); resetToFirstPage() }}
          showClearButton={!!paymentMethod}
          onClear={() => { setPaymentMethod(''); resetToFirstPage() }}
        >
          <option value="">{locale === 'bn' ? 'নগদ ও বাকি উভয়' : 'Both cash and credit'}</option>
          <option value="CASH">{locale === 'bn' ? 'নগদ স্টক' : 'Cash stock'}</option>
          <option value="CREDIT">{locale === 'bn' ? 'বাকি স্টক' : 'Credit stock'}</option>
        </FloatingSelect>
      </div>
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <TableSkeleton columns={3} rows={8} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{t('product.name')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{t('product.stock')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products?.data?.map(p => (
                <tr key={p.id} onClick={() => onSelect(p)}
                  className={`cursor-pointer transition-colors ${selected?.id === p.id ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    <div className="flex items-center gap-2.5">
                      {p.images?.[0]?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0].image} alt="" className="w-9 h-9 object-cover rounded-md border border-gray-100 shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-md border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-300 text-xs shrink-0">—</div>
                      )}
                      <span>{locale === 'bn' ? p.name_bn : p.name_en}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{p.sku}</td>
                  <td className="px-4 py-3">
                    <Badge className="font-bold" variant={Number(p.stock_on_hand) > 0 ? 'green' : 'red'}>
                      {formatNumber(parseFloat(p.stock_on_hand), locale)}
                    </Badge>
                  </td>
                </tr>
              ))}
              {products?.data?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">
                    {locale === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {products && (products.pagination.total_pages ?? 1) > 1 && (
        <div className="shrink-0 border-t border-gray-100 py-2 overflow-x-auto">
          <Pagination page={page} totalPages={products.pagination.total_pages ?? 1} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}

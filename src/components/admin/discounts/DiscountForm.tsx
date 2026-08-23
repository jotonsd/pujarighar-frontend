'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { FloatingInput, FloatingSelect, FloatingDatePicker, Checkbox } from '@/components/ui/forms'
import Pagination from '@/components/ui/Pagination'
import { toast } from '@/store/toastStore'
import { useCreateDiscountMutation, useBulkCreateDiscountMutation } from '@/api/discounts/discountsApi'
import { useGetProductsQuery } from '@/api/products/productsApi'
import { useGetCategoriesQuery } from '@/api/categories/categoriesApi'
import { useGetBrandsQuery } from '@/api/brands/brandsApi'
import { formatAmount } from '@/utils/format'
import { X } from 'lucide-react'

const EMPTY = {
  product: '',
  discount_type: 'PERCENTAGE',
  discount_value: '',
  note: '',
  start_date: '',
  end_date: '',
}

function BulkProductPicker({
  selected,
  onToggle,
  onClear,
  locale,
}: {
  selected: Set<string>
  onToggle: (id: string) => void
  onClear: () => void
  locale: string
}) {
  const isBn = locale === 'bn'
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [page, setPage] = useState(1)

  const { data: products, isLoading } = useGetProductsQuery({
    page, page_size: 10, search, category: category || undefined, brand: brand || undefined, is_package: 'false',
  })
  const { data: categories = [] } = useGetCategoriesQuery()
  const { data: brands = [] } = useGetBrandsQuery()

  const resetPage = () => setPage(1)

  return (
    <div className="space-y-2">
      <FloatingInput
        label={isBn ? 'পণ্য খুঁজুন' : 'Search products'}
        value={search}
        onChange={e => { setSearch(e.target.value); resetPage() }}
      />
      <div className="grid grid-cols-2 gap-2">
        <FloatingSelect
          label={isBn ? 'কেটাগরি' : 'Category'}
          value={category}
          onChange={val => { setCategory(val); resetPage() }}
          showClearButton={!!category}
          onClear={() => { setCategory(''); resetPage() }}
        >
          <option value="">{isBn ? 'সব কেটাগরি' : 'All categories'}</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{isBn ? c.name_bn : c.name_en}</option>
          ))}
        </FloatingSelect>
        <FloatingSelect
          label={isBn ? 'ব্র্যান্ড' : 'Brand'}
          value={brand}
          onChange={val => { setBrand(val); resetPage() }}
          showClearButton={!!brand}
          onClear={() => { setBrand(''); resetPage() }}
        >
          <option value="">{isBn ? 'সব ব্র্যান্ড' : 'All brands'}</option>
          {brands.map(b => (
            <option key={b.id} value={b.id}>{isBn ? b.name_bn : b.name_en}</option>
          ))}
        </FloatingSelect>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs">
          <span className="text-amber-700 font-semibold">
            {isBn ? `${selected.size}টি পণ্য নির্বাচিত` : `${selected.size} product(s) selected`}
          </span>
          <button type="button" onClick={onClear} className="text-gray-400 hover:text-red-600 inline-flex items-center gap-1">
            <X className="w-3 h-3" /> {isBn ? 'মুছুন' : 'Clear'}
          </button>
        </div>
      )}

      <div className="border border-gray-100 rounded-lg max-h-64 overflow-y-auto divide-y divide-gray-50">
        {isLoading ? (
          <p className="text-center text-xs text-gray-400 py-6">{isBn ? 'লোড হচ্ছে...' : 'Loading...'}</p>
        ) : products?.data?.length ? (
          products.data.map(p => (
            <label key={p.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50">
              <Checkbox checked={selected.has(p.id)} onChange={() => onToggle(p.id)} label="" />
              {p.images?.[0]?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[0].image} alt="" className="w-8 h-8 rounded-md object-cover border border-gray-100 shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-md border border-gray-100 bg-gray-50 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm text-gray-700">{isBn ? p.name_bn : p.name_en}</div>
                <div className="text-[11px] text-gray-400 font-mono">{p.sku}</div>
              </div>
              <div className="text-xs font-semibold text-gray-600 shrink-0">{formatAmount(p.unit_price, locale)}</div>
            </label>
          ))
        ) : (
          <p className="text-center text-xs text-gray-400 py-6">{isBn ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}</p>
        )}
      </div>

      {products && (products.pagination.total_pages ?? 1) > 1 && (
        <Pagination page={page} totalPages={products.pagination.total_pages ?? 1} onPageChange={setPage} />
      )}
    </div>
  )
}

export default function DiscountForm() {
  const locale = useLocale()
  const isBn   = locale === 'bn'

  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [form, setForm] = useState(EMPTY)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: products } = useGetProductsQuery({ page_size: 200, include_inactive: false })
  const [create, { isLoading: creating }] = useCreateDiscountMutation()
  const [bulkCreate, { isLoading: bulkCreating }] = useBulkCreateDiscountMutation()

  const set = (key: keyof typeof EMPTY, val: string) =>
    setForm(p => ({ ...p, [key]: val }))

  const toggleSelected = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const resetSharedFields = () =>
    setForm(p => ({ ...EMPTY, product: p.product }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.discount_value) return

    if (mode === 'bulk') {
      if (selectedIds.size === 0) return
      try {
        const created = await bulkCreate({
          product_ids: Array.from(selectedIds),
          discount_type: form.discount_type,
          discount_value: form.discount_value,
          note: form.note,
          start_date: form.start_date || null,
          end_date:   form.end_date   || null,
        }).unwrap()
        setSelectedIds(new Set())
        resetSharedFields()
        toast.success(
          isBn ? `${created.length}টি পণ্যে ডিসকাউন্ট যোগ হয়েছে` : `Discount added to ${created.length} product(s)`,
        )
      } catch {
        toast.error(isBn ? 'ব্যর্থ হয়েছে' : 'Failed')
      }
      return
    }

    if (!form.product) return
    try {
      await create({
        ...form,
        start_date: form.start_date || null,
        end_date:   form.end_date   || null,
      }).unwrap()
      setForm(EMPTY)
      toast.success(isBn ? 'ডিসকাউন্ট যোগ হয়েছে' : 'Discount created')
    } catch {
      toast.error(isBn ? 'ব্যর্থ হয়েছে' : 'Failed')
    }
  }

  const productOptions = products?.data ?? []
  const selectedProduct = productOptions.find(p => p.id === form.product)
  const startDateObj = form.start_date ? new Date(form.start_date) : undefined

  const newPrice = (() => {
    if (!selectedProduct) return null
    const price = parseFloat(selectedProduct.unit_price)
    const val = parseFloat(form.discount_value)
    if (!val || val <= 0) return price
    const raw = form.discount_type === 'PERCENTAGE' ? (price * val) / 100 : val
    return Math.max(0, price - Math.min(raw, price))
  })()

  const submitDisabled = mode === 'single'
    ? (creating || !form.product || !form.discount_value)
    : (bulkCreating || selectedIds.size === 0 || !form.discount_value)

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">{isBn ? 'নতুন ডিসকাউন্ট' : 'New Discount'}</h3>
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${mode === 'single' ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {isBn ? 'একক' : 'Single'}
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${mode === 'bulk' ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {isBn ? 'বাল্ক' : 'Bulk'}
          </button>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-3">
        {mode === 'single' ? (
          <>
            <FloatingSelect
              label={isBn ? 'পণ্য' : 'Product'}
              value={form.product}
              onChange={val => set('product', val)}
              placeholder={isBn ? 'পণ্য বেছে নিন' : 'Select product'}
              options={productOptions.map(p => ({
                value: p.id,
                label: isBn ? p.name_bn : p.name_en,
                image: p.images?.[0]?.image ?? null,
              }))}
            />

            {selectedProduct && (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-xs space-y-2">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-gray-400">{isBn ? 'ক্রয় মূল্য' : 'Purchase Price'}</p>
                    <p className="font-semibold text-gray-700">{formatAmount(selectedProduct.cost_price, locale, 2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">{isBn ? 'বিক্রয় মূল্য' : 'Selling Price'}</p>
                    <p className="font-semibold text-gray-700">{formatAmount(selectedProduct.unit_price, locale, 2)}</p>
                  </div>
                </div>

                {selectedProduct.active_discount_type && (
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
                    <div>
                      <p className="text-gray-400">{isBn ? 'বিদ্যমান ছাড়' : 'Existing Discount'}</p>
                      <p className="font-semibold text-amber-700">
                        {selectedProduct.active_discount_type === 'PERCENTAGE'
                          ? `${selectedProduct.active_discount_value}%`
                          : formatAmount(selectedProduct.active_discount_value ?? '0', locale, 2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">{isBn ? 'বর্তমান মূল্য' : 'Current Price'}</p>
                      <p className="font-semibold text-gray-700">{formatAmount(selectedProduct.effective_price, locale, 2)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <BulkProductPicker
            selected={selectedIds}
            onToggle={toggleSelected}
            onClear={() => setSelectedIds(new Set())}
            locale={locale}
          />
        )}

        <FloatingSelect
          label={isBn ? 'ছাড়ের ধরন' : 'Discount Type'}
          value={form.discount_type}
          onChange={val => set('discount_type', val)}
        >
          <option value="PERCENTAGE">{isBn ? 'শতাংশ (%)' : 'Percentage (%)'}</option>
          <option value="FLAT">{isBn ? 'নির্দিষ্ট পরিমাণ (৳)' : 'Flat Amount (৳)'}</option>
        </FloatingSelect>

        <FloatingInput
          label={form.discount_type === 'PERCENTAGE'
            ? (isBn ? 'ছাড় (%)' : 'Discount (%)')
            : (isBn ? 'ছাড় (৳)' : 'Discount (৳)')}
          type="number"
          min="0"
          step="0.01"
          required
          value={form.discount_value}
          onChange={e => set('discount_value', e.target.value)}
        />

        {mode === 'single' && selectedProduct && newPrice !== null && parseFloat(form.discount_value || '0') > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-green-50 border border-green-100 rounded-lg text-xs">
            <span className="text-green-600">{isBn ? 'নতুন মূল্য হবে' : 'New price will be'}</span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-bold text-green-700">{formatAmount(newPrice, locale, 2)}</span>
              <span className="text-gray-400 line-through">{formatAmount(selectedProduct.unit_price, locale, 2)}</span>
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FloatingDatePicker
            label={isBn ? 'শুরুর তারিখ' : 'Start Date'}
            value={form.start_date}
            onChange={val => set('start_date', val)}
            clearable
          />
          <FloatingDatePicker
            label={isBn ? 'শেষের তারিখ' : 'End Date'}
            value={form.end_date}
            onChange={val => set('end_date', val)}
            minDate={startDateObj}
            clearable
          />
        </div>

        <FloatingInput
          label={isBn ? 'নোট (ঐচ্ছিক)' : 'Note (optional)'}
          value={form.note}
          onChange={e => set('note', e.target.value)}
        />

        <button type="submit" disabled={submitDisabled} className="btn-primary w-full">
          {mode === 'single'
            ? (creating ? (isBn ? 'যোগ হচ্ছে...' : 'Adding...') : (isBn ? 'ডিসকাউন্ট যোগ করুন' : 'Add Discount'))
            : (bulkCreating
              ? (isBn ? 'যোগ হচ্ছে...' : 'Adding...')
              : (isBn ? `${selectedIds.size}টি পণ্যে যোগ করুন` : `Add to ${selectedIds.size} product(s)`))}
        </button>
      </form>
    </div>
  )
}

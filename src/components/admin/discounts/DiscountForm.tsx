'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { FloatingInput, FloatingSelect, FloatingDatePicker } from '@/components/ui/forms'
import { toast } from '@/store/toastStore'
import { useCreateDiscountMutation } from '@/api/discounts/discountsApi'
import { useGetProductsQuery } from '@/api/products/productsApi'
import { formatAmount } from '@/utils/format'

const EMPTY = {
  product: '',
  discount_type: 'PERCENTAGE',
  discount_value: '',
  note: '',
  start_date: '',
  end_date: '',
}

export default function DiscountForm() {
  const locale = useLocale()
  const isBn   = locale === 'bn'

  const [form, setForm] = useState(EMPTY)

  const { data: products } = useGetProductsQuery({ page_size: 200, include_inactive: false })
  const [create, { isLoading: creating }] = useCreateDiscountMutation()

  const set = (key: keyof typeof EMPTY, val: string) =>
    setForm(p => ({ ...p, [key]: val }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.product || !form.discount_value) return
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

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold text-gray-700">{isBn ? 'নতুন ডিসকাউন্ট' : 'New Discount'}</h3>
      <form onSubmit={handleCreate} className="space-y-3">
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
                  <p className="font-semibold text-amber-600">
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

        {selectedProduct && newPrice !== null && parseFloat(form.discount_value || '0') > 0 && (
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

        <button type="submit" disabled={creating} className="btn-primary w-full">
          {creating
            ? (isBn ? 'যোগ হচ্ছে...' : 'Adding...')
            : (isBn ? 'ডিসকাউন্ট যোগ করুন' : 'Add Discount')}
        </button>
      </form>
    </div>
  )
}

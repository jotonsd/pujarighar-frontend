'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { FloatingInput, FloatingSelect, FloatingDatePicker } from '@/components/ui/forms'
import { toast } from '@/store/toastStore'
import { useCreateDiscountMutation } from '@/api/discounts/discountsApi'
import { useGetProductsQuery } from '@/api/products/productsApi'

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
  const startDateObj = form.start_date ? new Date(form.start_date) : undefined

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold text-gray-700">{isBn ? 'নতুন ডিসকাউন্ট' : 'New Discount'}</h3>
      <form onSubmit={handleCreate} className="space-y-3">
        <FloatingSelect
          label={isBn ? 'পণ্য' : 'Product'}
          value={form.product}
          onChange={val => set('product', val)}
        >
          <option value="">{isBn ? 'পণ্য বেছে নিন' : 'Select product'}</option>
          {productOptions.map(p => (
            <option key={p.id} value={p.id}>{isBn ? p.name_bn : p.name_en}</option>
          ))}
        </FloatingSelect>

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

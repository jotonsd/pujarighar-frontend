'use client'

import { useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { RefreshCw } from 'lucide-react'
import { FloatingInput } from '@/components/ui/forms'
import { toast } from '@/store/toastStore'
import { useCreateCategoryMutation } from '@/api/categories/categoriesApi'

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

interface Props {
  onClose: () => void
}

export default function CategoryCreateForm({ onClose }: Props) {
  const t      = useTranslations()
  const locale = useLocale()
  const slugManualRef = useRef(false)

  const [form, setForm] = useState({ name_bn: '', name_en: '', slug: '' })
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation()

  const handleCreate = async () => {
    if (!form.name_bn || !form.name_en || !form.slug) {
      toast.error(locale === 'bn' ? 'সব ফিল্ড পূরণ করুন' : 'All fields are required')
      return
    }
    try {
      await createCategory(form).unwrap()
      toast.success(locale === 'bn' ? 'কেটাগরি তৈরি হয়েছে' : 'Category created')
      setForm({ name_bn: '', name_en: '', slug: '' })
      slugManualRef.current = false
      onClose()
    } catch (err: unknown) {
      const e = err as { data?: { error?: { message_en?: string; message_bn?: string } } }
      toast.error(locale === 'bn' ? (e.data?.error?.message_bn ?? 'ব্যর্থ হয়েছে') : (e.data?.error?.message_en ?? 'Failed'))
    }
  }

  return (
    <div className="card mb-4 space-y-3">
      <h2 className="font-medium text-gray-700">{locale === 'bn' ? 'নতুন কেটাগরি' : 'New Category'}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FloatingInput label="নাম (বাংলা) *" value={form.name_bn}
          onChange={e => setForm(f => ({ ...f, name_bn: e.target.value }))} />
        <FloatingInput label="Name (English) *" value={form.name_en}
          onChange={e => {
            const val = e.target.value
            setForm(f => ({ ...f, name_en: val, ...(!slugManualRef.current && { slug: slugify(val) }) }))
          }} />
        <div className="flex gap-2 items-start">
          <FloatingInput label="Slug *" value={form.slug}
            onChange={e => { slugManualRef.current = true; setForm(f => ({ ...f, slug: e.target.value })) }}
            className="flex-1" />
          <button type="button"
            onClick={() => { slugManualRef.current = false; setForm(f => ({ ...f, slug: slugify(f.name_en) })) }}
            title={locale === 'bn' ? 'পুনরায় তৈরি করুন' : 'Regenerate slug'}
            className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:text-amber-600 hover:border-amber-400 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleCreate} disabled={creating} className="btn-primary text-sm">
          {creating ? t('common.loading') : t('common.create')}
        </button>
        <button onClick={onClose} className="btn-secondary text-sm">{t('common.cancel')}</button>
      </div>
    </div>
  )
}

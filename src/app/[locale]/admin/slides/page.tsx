'use client'

import { useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { FloatingInput } from '@/components/ui/forms'
import ToggleSwitch from '@/components/ui/forms/ToggleSwitch'
import { toast } from '@/store/toastStore'
import { ReusableTable, Column, QuickAction } from '@/components/ui/ReusableTable'
import {
  useGetAllHeroSlidesQuery,
  useCreateHeroSlideMutation,
  useUpdateHeroSlideMutation,
  useDeleteHeroSlideMutation,
  HeroSlide,
} from '@/api/heroSlides/heroSlidesApi'

const EMPTY_FORM = {
  title_bn: '', title_en: '', subtitle_bn: '', subtitle_en: '',
  cta_label_bn: '', cta_label_en: '', cta_link: '', bg_color: '#FFF7ED', order: 0,
}

export default function HeroSlidesAdminPage() {
  const locale = useLocale()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [form, setForm]         = useState({ ...EMPTY_FORM })
  const fileRef                 = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { data: slides = [], isLoading } = useGetAllHeroSlidesQuery()
  const [createSlide, { isLoading: creating }] = useCreateHeroSlideMutation()
  const [updateSlide, { isLoading: updating }] = useUpdateHeroSlideMutation()
  const [deleteSlide]                          = useDeleteHeroSlideMutation()

  const saving = creating || updating
  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }))

  const openCreate = () => {
    setEditId(null); setForm({ ...EMPTY_FORM }); setImageFile(null); setImagePreview(null); setShowForm(true)
  }

  const openEdit = (s: HeroSlide) => {
    setEditId(s.id)
    setForm({ title_bn: s.title_bn, title_en: s.title_en, subtitle_bn: s.subtitle_bn, subtitle_en: s.subtitle_en, cta_label_bn: s.cta_label_bn, cta_label_en: s.cta_label_en, cta_link: s.cta_link, bg_color: s.bg_color, order: s.order })
    setImageFile(null); setImagePreview(s.image ?? null); setShowForm(true)
  }

  const buildFd = () => {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    if (imageFile) fd.append('image', imageFile)
    return fd
  }

  const handleSave = async () => {
    if (!form.title_bn && !form.title_en) {
      toast.error(locale === 'bn' ? 'শিরোনাম দিন' : 'Title is required'); return
    }
    try {
      const fd = buildFd()
      if (editId) {
        await updateSlide({ id: editId, data: fd }).unwrap()
        toast.success(locale === 'bn' ? 'স্লাইড আপডেট হয়েছে' : 'Slide updated')
      } else {
        await createSlide(fd).unwrap()
        toast.success(locale === 'bn' ? 'স্লাইড তৈরি হয়েছে' : 'Slide created')
      }
      setShowForm(false); setEditId(null); setForm({ ...EMPTY_FORM }); setImageFile(null); setImagePreview(null)
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'bn' ? 'মুছে ফেলবেন?' : 'Delete this slide?')) return
    try { await deleteSlide(id).unwrap(); toast.success('Deleted') }
    catch { toast.error('Failed') }
  }

  const handleToggle = async (s: HeroSlide) => {
    const fd = new FormData(); fd.append('is_active', String(!s.is_active))
    try { await updateSlide({ id: s.id, data: fd }).unwrap() }
    catch { toast.error('Failed') }
  }

  const columns: Column<HeroSlide>[] = [
    {
      header: locale === 'bn' ? 'ছবি' : 'Image',
      accessor: (s) => s.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.image} alt="" className="w-20 h-12 object-cover rounded-lg border border-gray-100" />
      ) : (
        <div className="w-20 h-12 rounded-lg border border-gray-100 flex items-center justify-center" style={{ backgroundColor: s.bg_color }}>
          <span className="text-xs text-gray-400">—</span>
        </div>
      ),
      className: 'px-4 py-2 w-28',
    },
    {
      header: locale === 'bn' ? 'শিরোনাম' : 'Title',
      accessor: (s) => (
        <div>
          <p className="font-medium text-gray-800 text-sm">{locale === 'bn' ? s.title_bn : s.title_en}</p>
          {(s.subtitle_bn || s.subtitle_en) && (
            <p className="text-xs text-gray-400 truncate max-w-xs">{locale === 'bn' ? s.subtitle_bn : s.subtitle_en}</p>
          )}
        </div>
      ),
    },
    {
      header: 'CTA',
      accessor: (s) => s.cta_link ? (
        <span className="text-xs text-blue-500 truncate max-w-xs block">{s.cta_link}</span>
      ) : <span className="text-xs text-gray-300">—</span>,
    },
    {
      header: locale === 'bn' ? 'ক্রম' : 'Order',
      accessor: (s) => <span className="text-xs text-gray-500">#{s.order}</span>,
      className: 'px-4 py-3 w-20',
    },
    {
      header: locale === 'bn' ? 'স্ট্যাটাস' : 'Status',
      accessor: (s) => (
        <ToggleSwitch
          checked={s.is_active}
          onChange={() => handleToggle(s)}
          activeLabel={locale === 'bn' ? 'সক্রিয়' : 'Active'}
          inactiveLabel={locale === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}
        />
      ),
      className: 'px-4 py-3 w-36',
    },
  ]

  const quickActions: QuickAction<HeroSlide>[] = [
    {
      label: 'Edit', icon: <Pencil className="w-3.5 h-3.5" />, onClick: openEdit,
      className: 'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors',
    },
    {
      label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, onClick: (s) => handleDelete(s.id),
      className: 'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors',
    },
  ]

  return (
    <div>
      <PageHeader
        title={locale === 'bn' ? 'হিরো স্লাইডার' : 'Hero Slider'}
        description={locale === 'bn' ? 'হোম পেজের হিরো স্লাইডার পরিচালনা করুন' : 'Manage home page hero slider images'}
        onAdd={openCreate}
        addLabel={locale === 'bn' ? 'নতুন স্লাইড' : 'New Slide'}
      />

      {showForm && (
        <div className="card mb-6 space-y-4">
          <h2 className="font-semibold text-gray-700">
            {editId ? (locale === 'bn' ? 'স্লাইড সম্পাদনা' : 'Edit Slide') : (locale === 'bn' ? 'নতুন স্লাইড' : 'New Slide')}
          </h2>

          {/* Image upload */}
          <div>
            <p className="text-xs text-gray-500 mb-2">{locale === 'bn' ? 'ছবি' : 'Image'}</p>
            <div className="flex items-center gap-3">
              {imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Preview" className="w-32 h-20 object-cover rounded-lg border border-gray-200" />
              )}
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-xs px-3 py-1.5">
                {locale === 'bn' ? '+ ছবি বেছে নিন' : '+ Choose Image'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (!f) return; setImageFile(f); setImagePreview(URL.createObjectURL(f)) }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FloatingInput label="শিরোনাম (বাংলা)" value={form.title_bn} onChange={f('title_bn')} />
            <FloatingInput label="Title (English)" value={form.title_en} onChange={f('title_en')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FloatingInput label="সাব-শিরোনাম (বাংলা)" value={form.subtitle_bn} onChange={f('subtitle_bn')} />
            <FloatingInput label="Subtitle (English)" value={form.subtitle_en} onChange={f('subtitle_en')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FloatingInput label="CTA বাটন (বাংলা)" value={form.cta_label_bn} onChange={f('cta_label_bn')} />
            <FloatingInput label="CTA Button (English)" value={form.cta_label_en} onChange={f('cta_label_en')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FloatingInput label={locale === 'bn' ? 'লিংক' : 'Link'} value={form.cta_link} onChange={f('cta_link')} placeholder="/bn/products" />
            <div className="flex items-center gap-2">
              <input type="color" value={form.bg_color}
                onChange={e => setForm(p => ({ ...p, bg_color: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
              <span className="text-xs text-gray-400 font-mono">{form.bg_color}</span>
            </div>
            <FloatingInput label={locale === 'bn' ? 'ক্রম' : 'Order'} type="number" min="0" value={String(form.order)} onChange={f('order')} />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? '...' : editId ? (locale === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes') : (locale === 'bn' ? 'তৈরি করুন' : 'Create')}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">
              {locale === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      <ReusableTable
        data={slides}
        columns={columns}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        quickActions={quickActions}
        emptyMessage={locale === 'bn' ? 'কোনো স্লাইড নেই' : 'No slides yet'}
        exportFilename="hero-slides"
      />
    </div>
  )
}

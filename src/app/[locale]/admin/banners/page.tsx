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
  useGetAllBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  Banner,
} from '@/api/banners/bannersApi'

const BG_PRESETS = [
  '#fef2f2', '#fee2e2', '#F0FDF4', '#EFF6FF', '#FDF2F8',
  '#ECFDF5', '#FFF1F2', '#F5F3FF', '#fef2f2', '#F0F9FF',
]

const EMPTY_FORM = {
  title_bn: '', title_en: '', subtitle_bn: '', subtitle_en: '',
  badge_text: '', bg_color: '#fef2f2', link: '', order: 0,
}

export default function BannersAdminPage() {
  const locale = useLocale()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [form, setForm]         = useState({ ...EMPTY_FORM })
  const fileRef                 = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { data: banners = [], isLoading } = useGetAllBannersQuery()
  const [createBanner, { isLoading: creating }] = useCreateBannerMutation()
  const [updateBanner, { isLoading: updating }] = useUpdateBannerMutation()
  const [deleteBanner]                          = useDeleteBannerMutation()

  const saving = creating || updating

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }))

  const openCreate = () => {
    setEditId(null); setForm({ ...EMPTY_FORM }); setImageFile(null); setImagePreview(null); setShowForm(true)
  }

  const openEdit = (b: Banner) => {
    setEditId(b.id)
    setForm({ title_bn: b.title_bn, title_en: b.title_en, subtitle_bn: b.subtitle_bn, subtitle_en: b.subtitle_en, badge_text: b.badge_text, bg_color: b.bg_color, link: b.link, order: b.order })
    setImageFile(null)
    setImagePreview(b.image ?? null)
    setShowForm(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const buildFormData = () => {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
    if (imageFile) fd.append('image', imageFile)
    return fd
  }

  const handleSave = async () => {
    if (!form.title_bn || !form.title_en) {
      toast.error(locale === 'bn' ? 'শিরোনাম আবশ্যিক' : 'Title is required'); return
    }
    try {
      const fd = buildFormData()
      if (editId) {
        await updateBanner({ id: editId, data: fd }).unwrap()
        toast.success(locale === 'bn' ? 'ব্যানার আপডেট হয়েছে' : 'Banner updated')
      } else {
        await createBanner(fd).unwrap()
        toast.success(locale === 'bn' ? 'ব্যানার তৈরি হয়েছে' : 'Banner created')
      }
      setShowForm(false); setEditId(null); setForm({ ...EMPTY_FORM }); setImageFile(null); setImagePreview(null)
    } catch {
      toast.error(locale === 'bn' ? 'ব্যর্থ হয়েছে' : 'Failed')
    }
  }

  const handleToggleActive = async (b: Banner) => {
    const fd = new FormData()
    fd.append('is_active', String(!b.is_active))
    try {
      await updateBanner({ id: b.id, data: fd }).unwrap()
    } catch {
      toast.error('Failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'bn' ? 'মুছে ফেলবেন?' : 'Delete this banner?')) return
    try { await deleteBanner(id).unwrap(); toast.success('Deleted') }
    catch { toast.error('Failed') }
  }

  const columns: Column<Banner>[] = [
    {
      header: locale === 'bn' ? 'ছবি' : 'Image',
      accessor: (b) => b.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b.image} alt="" className="w-16 h-10 object-cover rounded-lg border border-gray-100" />
      ) : (
        <div className="w-16 h-10 rounded-lg border border-gray-100 flex items-center justify-center" style={{ backgroundColor: b.bg_color }}>
          <span className="text-xs text-gray-400">—</span>
        </div>
      ),
      className: 'px-4 py-2 w-24',
    },
    {
      header: locale === 'bn' ? 'শিরোনাম' : 'Title',
      accessor: (b) => (
        <div>
          <p className="font-medium text-gray-800 text-sm">
            {locale === 'bn' ? b.title_bn : b.title_en}
            {b.badge_text && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{b.badge_text}</span>
            )}
          </p>
          {(locale === 'bn' ? b.subtitle_bn : b.subtitle_en) && (
            <p className="text-xs text-gray-400">{locale === 'bn' ? b.subtitle_bn : b.subtitle_en}</p>
          )}
        </div>
      ),
    },
    {
      header: locale === 'bn' ? 'লিংক' : 'Link',
      accessor: (b) => b.link ? (
        <span className="text-xs text-blue-500 truncate max-w-xs block">{b.link}</span>
      ) : (
        <span className="text-xs text-gray-300">—</span>
      ),
    },
    {
      header: locale === 'bn' ? 'ক্রম' : 'Order',
      accessor: (b) => <span className="text-xs text-gray-500">#{b.order}</span>,
      className: 'px-4 py-3 w-20',
    },
    {
      header: locale === 'bn' ? 'স্ট্যাটাস' : 'Status',
      accessor: (b) => (
        <ToggleSwitch
          checked={b.is_active}
          onChange={() => handleToggleActive(b)}
          activeLabel={locale === 'bn' ? 'সক্রিয়' : 'Active'}
          inactiveLabel={locale === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}
        />
      ),
      className: 'px-4 py-3 w-36',
    },
  ]

  const quickActions: QuickAction<Banner>[] = [
    {
      label: 'Edit',
      icon: <Pencil className="w-3.5 h-3.5" />,
      onClick: openEdit,
      className: 'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors',
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (b) => handleDelete(b.id),
      className: 'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors',
    },
  ]

  return (
    <div>
      <PageHeader
        title={locale === 'bn' ? 'অফার ব্যানার' : 'Offer Banners'}
        description={locale === 'bn' ? 'পণ্য পাতায় স্ক্রোলযোগ্য অফার ব্যানার পরিচালনা করুন' : 'Manage scrollable offer banners on the products page'}
        onAdd={openCreate}
        addLabel={locale === 'bn' ? 'নতুন ব্যানার' : 'New Banner'}
      />

      {/* Form */}
      {showForm && (
        <div className="card mb-6 space-y-4">
          <h2 className="font-semibold text-gray-700">
            {editId ? (locale === 'bn' ? 'ব্যানার সম্পাদনা' : 'Edit Banner') : (locale === 'bn' ? 'নতুন ব্যানার' : 'New Banner')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <FloatingInput label="শিরোনাম (বাংলা) *" value={form.title_bn} onChange={f('title_bn')} />
            <FloatingInput label="Title (English) *" value={form.title_en} onChange={f('title_en')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FloatingInput label="সাব-শিরোনাম (বাংলা)" value={form.subtitle_bn} onChange={f('subtitle_bn')} />
            <FloatingInput label="Subtitle (English)" value={form.subtitle_en} onChange={f('subtitle_en')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FloatingInput label={locale === 'bn' ? 'ব্যাজ টেক্সট (যেমন: ২০% ছাড়)' : 'Badge text (e.g. 20% Off)'} value={form.badge_text} onChange={f('badge_text')} />
            <FloatingInput label={locale === 'bn' ? 'লিংক (ঐচ্ছিক)' : 'Link (optional)'} value={form.link} onChange={f('link')} placeholder="/bn/products?category=..." />
            <FloatingInput label={locale === 'bn' ? 'ক্রম' : 'Order'} type="number" min="0" value={String(form.order)} onChange={f('order')} />
          </div>

          {/* Background color */}
          <div>
            <p className="text-xs text-gray-500 mb-2">{locale === 'bn' ? 'পটভূমির রঙ' : 'Background Color'}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {BG_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, bg_color: color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${form.bg_color === color ? 'border-amber-500 scale-110' : 'border-gray-200'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={form.bg_color}
                onChange={(e) => setForm((p) => ({ ...p, bg_color: e.target.value }))}
                className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer p-0.5"
                title="Custom color"
              />
              <span className="text-xs text-gray-400 font-mono">{form.bg_color}</span>
            </div>
          </div>

          {/* Image upload */}
          <div>
            <p className="text-xs text-gray-500 mb-2">{locale === 'bn' ? 'ছবি (ঐচ্ছিক)' : 'Image (optional)'}</p>
            <div className="flex items-center gap-3">
              {imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Preview" className="w-20 h-12 object-cover rounded-lg border border-gray-200" />
              )}
              <button type="button" onClick={() => fileRef.current?.click()}
                className="btn-secondary text-xs px-3 py-1.5">
                {locale === 'bn' ? '+ ছবি বেছে নিন' : '+ Choose Image'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
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
        data={banners}
        columns={columns}
        keyExtractor={(b) => b.id}
        isLoading={isLoading}
        quickActions={quickActions}
        emptyMessage={locale === 'bn' ? 'কোনো ব্যানার নেই। নতুন তৈরি করুন।' : 'No banners yet. Create your first offer.'}
        exportFilename="banners"
      />
    </div>
  )
}

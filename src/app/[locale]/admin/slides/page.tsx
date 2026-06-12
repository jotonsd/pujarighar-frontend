'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ToggleSwitch from '@/components/ui/forms/ToggleSwitch'
import { toast } from '@/store/toastStore'
import { ReusableTable, Column, QuickAction } from '@/components/ui/ReusableTable'
import { HeroSlide, useGetAllHeroSlidesQuery, useUpdateHeroSlideMutation, useDeleteHeroSlideMutation } from '@/api/heroSlides/heroSlidesApi'
import SlideForm from '@/components/admin/slides/SlideForm'

export default function HeroSlidesAdminPage() {
  const locale = useLocale()
  const isBn = locale === 'bn'
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<HeroSlide | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: slides = [], isLoading } = useGetAllHeroSlidesQuery()
  const [updateSlide] = useUpdateHeroSlideMutation()
  const [deleteSlide] = useDeleteHeroSlideMutation()

  const openCreate = () => { setEditItem(null); setShowForm(true) }
  const openEdit   = (s: HeroSlide) => { setEditItem(s); setShowForm(true) }
  const closeForm  = () => { setShowForm(false); setEditItem(null) }

  const handleToggle = async (s: HeroSlide) => {
    const fd = new FormData()
    fd.append('is_active', String(!s.is_active))
    try { await updateSlide({ id: s.id, data: fd }).unwrap() }
    catch { toast.error('Failed') }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try { await deleteSlide(deleteTarget).unwrap(); toast.success(isBn ? 'মুছে ফেলা হয়েছে' : 'Deleted') }
    catch { toast.error(isBn ? 'মুছতে ব্যর্থ হয়েছে' : 'Failed to delete') }
    finally { setDeleting(false); setDeleteTarget(null) }
  }

  const columns: Column<HeroSlide>[] = [
    {
      header: locale === 'bn' ? 'ছবি' : 'Image',
      accessor: s => s.image ? (
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
      accessor: s => (
        <div>
          <p className="font-medium text-gray-800 text-sm">{locale === 'bn' ? s.title_bn : s.title_en}</p>
          {(s.subtitle_bn || s.subtitle_en) && <p className="text-xs text-gray-400 truncate max-w-xs">{locale === 'bn' ? s.subtitle_bn : s.subtitle_en}</p>}
        </div>
      ),
    },
    {
      header: 'CTA',
      accessor: s => s.cta_link ? <span className="text-xs text-blue-500 truncate max-w-xs block">{s.cta_link}</span> : <span className="text-xs text-gray-300">—</span>,
    },
    { header: locale === 'bn' ? 'ক্রম' : 'Order', accessor: s => <span className="text-xs text-gray-500">#{s.order}</span>, className: 'px-4 py-3 w-20' },
    {
      header: locale === 'bn' ? 'স্ট্যাটাস' : 'Status',
      accessor: s => (
        <ToggleSwitch checked={s.is_active} onChange={() => handleToggle(s)}
          activeLabel={locale === 'bn' ? 'সক্রিয়' : 'Active'} inactiveLabel={locale === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'} />
      ),
      className: 'px-4 py-3 w-36',
    },
  ]

  const quickActions: QuickAction<HeroSlide>[] = [
    { label: 'Edit', icon: <Pencil className="w-3.5 h-3.5" />, onClick: openEdit, className: 'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors' },
    { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, onClick: s => setDeleteTarget(s.id), className: 'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors' },
  ]

  return (
    <div>
      <PageHeader
        title={locale === 'bn' ? 'হিরো স্লাইডার' : 'Hero Slider'}
        description={locale === 'bn' ? 'হোম পেজের হিরো স্লাইডার পরিচালনা করুন' : 'Manage home page hero slider images'}
        onAdd={openCreate} addLabel={locale === 'bn' ? 'নতুন স্লাইড' : 'New Slide'} />

      {showForm && <SlideForm editItem={editItem} onClose={closeForm} />}

      {deleteTarget && (
        <ConfirmModal
          icon={<Trash2 className="w-6 h-6 text-red-500" />}
          title={isBn ? 'স্লাইড মুছবেন?' : 'Delete slide?'}
          description={isBn ? 'এই স্লাইডটি স্থায়ীভাবে মুছে যাবে।' : 'This slide will be permanently deleted.'}
          confirmLabel={isBn ? 'হ্যাঁ, মুছুন' : 'Yes, Delete'}
          confirmClassName="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <ReusableTable data={slides} columns={columns} keyExtractor={s => s.id}
        isLoading={isLoading} quickActions={quickActions}
        emptyMessage={locale === 'bn' ? 'কোনো স্লাইড নেই' : 'No slides yet'}
        exportFilename="hero-slides" />
    </div>
  )
}

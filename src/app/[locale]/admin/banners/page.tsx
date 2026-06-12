'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ToggleSwitch from '@/components/ui/forms/ToggleSwitch'
import { toast } from '@/store/toastStore'
import { ReusableTable, Column, QuickAction } from '@/components/ui/ReusableTable'
import { Banner, useGetAllBannersQuery, useUpdateBannerMutation, useDeleteBannerMutation } from '@/api/banners/bannersApi'
import BannerForm from '@/components/admin/banners/BannerForm'

export default function BannersAdminPage() {
  const locale = useLocale()
  const isBn = locale === 'bn'
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Banner | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: banners = [], isLoading } = useGetAllBannersQuery()
  const [updateBanner] = useUpdateBannerMutation()
  const [deleteBanner] = useDeleteBannerMutation()

  const openCreate = () => { setEditItem(null); setShowForm(true) }
  const openEdit   = (b: Banner) => { setEditItem(b); setShowForm(true) }
  const closeForm  = () => { setShowForm(false); setEditItem(null) }

  const handleToggleActive = async (b: Banner) => {
    const fd = new FormData()
    fd.append('is_active', String(!b.is_active))
    try { await updateBanner({ id: b.id, data: fd }).unwrap() }
    catch { toast.error('Failed') }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try { await deleteBanner(deleteTarget).unwrap(); toast.success(isBn ? 'মুছে ফেলা হয়েছে' : 'Deleted') }
    catch { toast.error(isBn ? 'মুছতে ব্যর্থ হয়েছে' : 'Failed to delete') }
    finally { setDeleting(false); setDeleteTarget(null) }
  }

  const columns: Column<Banner>[] = [
    {
      header: locale === 'bn' ? 'ছবি' : 'Image',
      accessor: b => b.image ? (
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
      accessor: b => (
        <div>
          <p className="font-medium text-gray-800 text-sm">
            {locale === 'bn' ? b.title_bn : b.title_en}
            {b.badge_text && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{b.badge_text}</span>}
          </p>
          {(locale === 'bn' ? b.subtitle_bn : b.subtitle_en) && (
            <p className="text-xs text-gray-400">{locale === 'bn' ? b.subtitle_bn : b.subtitle_en}</p>
          )}
        </div>
      ),
    },
    {
      header: locale === 'bn' ? 'লিংক' : 'Link',
      accessor: b => b.link ? <span className="text-xs text-blue-500 truncate max-w-xs block">{b.link}</span> : <span className="text-xs text-gray-300">—</span>,
    },
    { header: locale === 'bn' ? 'ক্রম' : 'Order', accessor: b => <span className="text-xs text-gray-500">#{b.order}</span>, className: 'px-4 py-3 w-20' },
    {
      header: locale === 'bn' ? 'স্ট্যাটাস' : 'Status',
      accessor: b => (
        <ToggleSwitch checked={b.is_active} onChange={() => handleToggleActive(b)}
          activeLabel={locale === 'bn' ? 'সক্রিয়' : 'Active'} inactiveLabel={locale === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'} />
      ),
      className: 'px-4 py-3 w-36',
    },
  ]

  const quickActions: QuickAction<Banner>[] = [
    { label: 'Edit', icon: <Pencil className="w-3.5 h-3.5" />, onClick: openEdit, className: 'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors' },
    { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, onClick: b => setDeleteTarget(b.id), className: 'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors' },
  ]

  return (
    <div>
      <PageHeader
        title={locale === 'bn' ? 'অফার ব্যানার' : 'Offer Banners'}
        description={locale === 'bn' ? 'পণ্য পাতায় স্ক্রোলযোগ্য অফার ব্যানার পরিচালনা করুন' : 'Manage scrollable offer banners on the products page'}
        onAdd={openCreate} addLabel={locale === 'bn' ? 'নতুন ব্যানার' : 'New Banner'} />

      {showForm && <BannerForm editItem={editItem} onClose={closeForm} />}

      {deleteTarget && (
        <ConfirmModal
          icon={<Trash2 className="w-6 h-6 text-red-500" />}
          title={isBn ? 'ব্যানার মুছবেন?' : 'Delete banner?'}
          description={isBn ? 'এই ব্যানারটি স্থায়ীভাবে মুছে যাবে।' : 'This banner will be permanently deleted.'}
          confirmLabel={isBn ? 'হ্যাঁ, মুছুন' : 'Yes, Delete'}
          confirmClassName="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <ReusableTable data={banners} columns={columns} keyExtractor={b => b.id}
        isLoading={isLoading} quickActions={quickActions}
        emptyMessage={locale === 'bn' ? 'কোনো ব্যানার নেই। নতুন তৈরি করুন।' : 'No banners yet. Create your first offer.'}
        exportFilename="banners" />
    </div>
  )
}

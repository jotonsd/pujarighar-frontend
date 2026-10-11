'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ToggleSwitch from '@/components/ui/forms/ToggleSwitch'
import { toast } from '@/store/toastStore'
import { ReusableTable, Column, QuickAction } from '@/components/ui/ReusableTable'
import { PromoPopup, useGetAllPromoPopupsQuery, useUpdatePromoPopupMutation, useDeletePromoPopupMutation } from '@/api/promoPopups/promoPopupsApi'
import PromoPopupForm from '@/components/admin/promoPopups/PromoPopupForm'

export default function PromoPopupsAdminPage() {
  const locale = useLocale()
  const isBn = locale === 'bn'
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<PromoPopup | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: popups = [], isLoading } = useGetAllPromoPopupsQuery()
  const [updatePopup] = useUpdatePromoPopupMutation()
  const [deletePopup] = useDeletePromoPopupMutation()

  const openCreate = () => { setEditItem(null); setShowForm(true) }
  const openEdit   = (p: PromoPopup) => { setEditItem(p); setShowForm(true) }
  const closeForm  = () => { setShowForm(false); setEditItem(null) }

  const handleToggleActive = async (p: PromoPopup) => {
    const fd = new FormData()
    fd.append('is_active', String(!p.is_active))
    try { await updatePopup({ id: p.id, data: fd }).unwrap() }
    catch { toast.error('Failed') }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try { await deletePopup(deleteTarget).unwrap(); toast.success(isBn ? 'মুছে ফেলা হয়েছে' : 'Deleted') }
    catch { toast.error(isBn ? 'মুছতে ব্যর্থ হয়েছে' : 'Failed to delete') }
    finally { setDeleting(false); setDeleteTarget(null) }
  }

  const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleString(isBn ? 'bn-BD' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

  const columns: Column<PromoPopup>[] = [
    {
      header: isBn ? 'ছবি' : 'Image',
      accessor: p => p.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt="" className="w-14 h-14 object-cover rounded-lg border border-border" />
      ) : <span className="text-xs text-muted">—</span>,
      className: 'px-4 py-2 w-24',
    },
    {
      header: isBn ? 'লিংক' : 'Link',
      accessor: p => p.link ? <span className="text-xs text-blue-500 truncate max-w-xs block">{p.link}</span> : <span className="text-xs text-muted">—</span>,
    },
    {
      header: isBn ? 'বৈধতা' : 'Validity',
      accessor: p => (
        <div className="text-xs text-muted space-y-0.5">
          <p>{isBn ? 'শুরু: ' : 'From: '}{fmt(p.valid_from)}</p>
          <p>{isBn ? 'শেষ: ' : 'Until: '}{fmt(p.valid_until)}</p>
        </div>
      ),
    },
    { header: isBn ? 'ক্রম' : 'Order', accessor: p => <span className="text-xs text-muted">#{p.order}</span>, className: 'px-4 py-3 w-20' },
    {
      header: isBn ? 'স্ট্যাটাস' : 'Status',
      accessor: p => (
        <ToggleSwitch checked={p.is_active} onChange={() => handleToggleActive(p)}
          activeLabel={isBn ? 'সক্রিয়' : 'Active'} inactiveLabel={isBn ? 'নিষ্ক্রিয়' : 'Inactive'} />
      ),
      className: 'px-4 py-3 w-36',
    },
  ]

  const quickActions: QuickAction<PromoPopup>[] = [
    { label: 'Edit', icon: <Pencil className="w-3.5 h-3.5" />, onClick: openEdit, className: 'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors' },
    { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, onClick: p => setDeleteTarget(p.id), className: 'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors' },
  ]

  return (
    <div>
      <PageHeader
        title={isBn ? 'প্রোমো পপআপ' : 'Promo Popups'}
        description={isBn ? 'হোমপেজে প্রথমবার ভিজিটে দেখানো প্রোমোশনাল পপআপ পরিচালনা করুন' : 'Manage the promotional popup shown on a visitor\'s first homepage visit'}
        onAdd={openCreate} addLabel={isBn ? 'নতুন পপআপ' : 'New Popup'} />

      {showForm && <PromoPopupForm editItem={editItem} onClose={closeForm} />}

      {deleteTarget && (
        <ConfirmModal
          icon={<Trash2 className="w-6 h-6 text-red-500" />}
          title={isBn ? 'পপআপ মুছবেন?' : 'Delete popup?'}
          description={isBn ? 'এই পপআপটি স্থায়ীভাবে মুছে যাবে।' : 'This popup will be permanently deleted.'}
          confirmLabel={isBn ? 'হ্যাঁ, মুছুন' : 'Yes, Delete'}
          confirmClassName="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <ReusableTable data={popups} columns={columns} keyExtractor={p => p.id}
        isLoading={isLoading} quickActions={quickActions}
        emptyMessage={isBn ? 'কোনো পপআপ নেই। নতুন তৈরি করুন।' : 'No popups yet. Create your first one.'}
        exportFilename="promo-popups" />
    </div>
  )
}

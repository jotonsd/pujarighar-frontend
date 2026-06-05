'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Filter, X } from 'lucide-react'
import OrderStatusBadge from '@/components/orders/OrderStatusBadge'
import { FloatingDatePicker, FloatingInput, FloatingSelect } from '@/components/ui/forms'
import PageHeader from '@/components/ui/PageHeader'
import { ReusableTable, Column } from '@/components/ui/ReusableTable'
import { OrderStatus, SalesOrder } from '@/lib/types'
import { formatAmount, formatDate } from '@/utils/format'
import { useGetOrdersQuery } from '@/api/orders/ordersApi'

const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PACKED', 'ASSIGNED', 'ON_THE_WAY', 'DELIVERED', 'RETURNED', 'CANCELLED']
const EMPTY = { status: '', payment_status: '', order_number: '', phone: '', name: '', from: '', to: '' }

export default function OrderList() {
  const t      = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [page, setPage]               = useState(1)
  const [limit, setLimit]             = useState(10)
  const [showFilters, setShowFilters] = useState(false)
  const [draft, setDraft]             = useState(EMPTY)
  const [applied, setApplied]         = useState(EMPTY)

  const set = (k: keyof typeof draft) => (v: string) => setDraft(f => ({ ...f, [k]: v }))
  const activeCount = Object.values(applied).filter(Boolean).length
  const handleSubmit = () => { setApplied(draft); setPage(1) }
  const clearAll = () => { setDraft(EMPTY); setApplied(EMPTY); setPage(1) }

  const { data, isLoading } = useGetOrdersQuery({ page, page_size: limit, ...applied })

  const columns: Column<SalesOrder>[] = [
    { header: t('order.number'), accessor: o => <span className="font-mono text-sm">{o.order_number}</span>, exportValue: o => o.order_number },
    {
      header: locale === 'bn' ? 'গ্রাহক' : 'Customer',
      accessor: o => <div><p className="text-sm font-medium text-gray-800">{locale === 'bn' ? o.shipping_name_bn : o.shipping_name_en}</p><p className="text-xs text-gray-400">{o.shipping_phone}</p></div>,
      exportValue: o => `${o.shipping_name_en} / ${o.shipping_phone}`,
    },
    {
      header: t('order.total'),
      accessor: o => <span className="font-bold text-amber-600">{formatAmount(o.grand_total, locale)}</span>,
      exportValue: o => o.grand_total,
    },
    {
      header: locale === 'bn' ? 'পেমেন্ট' : 'Payment',
      accessor: o => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>{o.payment_method === 'COD' ? '💵' : '💳'}</span>
            <span>{o.payment_method === 'COD' ? 'COD' : (locale === 'bn' ? 'অনলাইন' : 'Online')}</span>
          </div>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${o.payment_status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {o.payment_status === 'PAID' ? (locale === 'bn' ? 'পেইড' : 'Paid') : (locale === 'bn' ? 'আনপেইড' : 'Unpaid')}
          </span>
        </div>
      ),
      exportValue: o => `${o.payment_method} / ${o.payment_status}`,
    },
    { header: t('order.status'), accessor: o => <OrderStatusBadge status={o.status} locale={locale} />, exportValue: o => o.status },
    {
      header: locale === 'bn' ? 'তারিখ' : 'Date',
      accessor: o => <span className="text-xs text-gray-500">{formatDate(o.created_at, locale)}</span>,
      exportValue: o => new Date(o.created_at).toLocaleDateString(),
    },
  ]

  return (
    <div>
      <PageHeader title={t('admin.orders')}
        addLabel={locale === 'bn' ? 'নতুন অর্ডার (POS)' : 'New Order (POS)'}
        onAdd={() => router.push(`/${locale}/admin/orders/new`)}
        actions={
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                <X className="w-3.5 h-3.5" />{locale === 'bn' ? 'ক্লিয়ার' : 'Clear'}
              </button>
            )}
            <button onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${showFilters || activeCount > 0 ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600'}`}>
              <Filter className="w-3.5 h-3.5" />
              {locale === 'bn' ? 'ফিল্টার' : 'Filter'}
              {activeCount > 0 && <span className="bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">{activeCount}</span>}
            </button>
          </div>
        } />

      {showFilters && (
        <div className="mb-5 p-4 bg-white rounded-2xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <FloatingInput label={locale === 'bn' ? 'অর্ডার নম্বর' : 'Order Number'} value={draft.order_number} onChange={e => set('order_number')(e.target.value)} />
          <FloatingInput label={locale === 'bn' ? 'ফোন নম্বর' : 'Phone Number'} value={draft.phone} onChange={e => set('phone')(e.target.value)} />
          <FloatingInput label={locale === 'bn' ? 'নাম' : 'Name'} value={draft.name} onChange={e => set('name')(e.target.value)} />
          <FloatingSelect label={t('order.status')} value={draft.status} onChange={set('status')}>
            <option value="">{t('common.all')}</option>
            {STATUSES.map(s => <option key={s} value={s}>{t(`order.${s}`)}</option>)}
          </FloatingSelect>
          <FloatingSelect label={locale === 'bn' ? 'পেমেন্ট' : 'Payment'} value={draft.payment_status} onChange={set('payment_status')}>
            <option value="">{t('common.all')}</option>
            <option value="PAID">{locale === 'bn' ? 'পেইড' : 'Paid'}</option>
            <option value="UNPAID">{locale === 'bn' ? 'আনপেইড' : 'Unpaid'}</option>
          </FloatingSelect>
          <FloatingDatePicker label={locale === 'bn' ? 'শুরু তারিখ' : 'From Date'} value={draft.from} onChange={set('from')} clearable />
          <FloatingDatePicker label={locale === 'bn' ? 'শেষ তারিখ' : 'To Date'} value={draft.to} onChange={set('to')} clearable />
          <div className="flex items-center"><button onClick={handleSubmit} className="btn-primary w-full">{locale === 'bn' ? 'খুঁজুন' : 'Apply'}</button></div>
        </div>
      )}

      <ReusableTable data={data?.data ?? []} columns={columns} keyExtractor={o => o.id}
        isLoading={isLoading} totalPages={data?.pagination?.total_pages ?? 1}
        totalRecords={data?.pagination?.total} currentPage={page} onPageChange={setPage}
        limit={limit} onLimitChange={l => { setLimit(l); setPage(1) }}
        exportFilename="orders" emptyMessage={locale === 'bn' ? 'কোনো অর্ডার নেই' : 'No orders found'}
        quickActions={[{
          label: t('common.edit'),
          render: o => (
            <Link href={`/${locale}/admin/orders/${o.id}`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              title={t('common.edit')}>
              <Eye className="w-3.5 h-3.5" />
            </Link>
          ),
        }]} />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Filter, X } from 'lucide-react'
import OrderStatusCell from '@/components/admin/orders/OrderStatusCell'
import OrderSourceBadge from '@/components/orders/OrderSourceBadge'
import CopyButton from '@/components/ui/CopyButton'
import { FloatingDatePicker, FloatingInput, FloatingSelect } from '@/components/ui/forms'
import PageHeader from '@/components/ui/PageHeader'
import { ReusableTable, Column } from '@/components/ui/ReusableTable'
import { OrderSource, OrderStatus, SalesOrder } from '@/lib/types'
import { formatAmount, formatDateTime, localName } from '@/utils/format'
import { useGetOrdersQuery } from '@/api/orders/ordersApi'

const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PACKED', 'ASSIGNED', 'PICKED', 'ON_THE_WAY', 'DELIVERED', 'RETURNED', 'EXCHANGED', 'CANCELLED']
const SOURCES: OrderSource[] = ['WEBSITE', 'MOBILE_APP', 'AI_CHATBOT', 'POS']
const SOURCE_LABELS: Record<OrderSource, { bn: string; en: string }> = {
  WEBSITE: { bn: 'ওয়েবসাইট', en: 'Website' },
  MOBILE_APP: { bn: 'মোবাইল অ্যাপ', en: 'Mobile App' },
  AI_CHATBOT: { bn: 'ব্রাহ্মণ AI', en: 'Brahman AI' },
  POS: { bn: 'POS', en: 'POS' },
}
const EMPTY = { status: '', payment_status: '', order_number: '', phone: '', name: '', source: '', from: '', to: '' }

export default function OrderList() {
  const t      = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [page, setPage]               = useState(1)
  const [limit, setLimit]             = useState(20)
  const [showFilters, setShowFilters] = useState(false)
  const [draft, setDraft]             = useState(EMPTY)
  const [applied, setApplied]         = useState(EMPTY)

  const set = (k: keyof typeof draft) => (v: string) => setDraft(f => ({ ...f, [k]: v }))
  const activeCount = Object.values(applied).filter(Boolean).length
  const handleSubmit = () => { setApplied(draft); setPage(1) }
  const clearAll = () => { setDraft(EMPTY); setApplied(EMPTY); setPage(1) }

  const { data, isLoading, isFetching } = useGetOrdersQuery({ page, page_size: limit, ...applied })

  const columns: Column<SalesOrder>[] = [
    { header: t('order.number'), accessor: o => <span className="font-mono text-sm">{o.order_number}</span>, exportValue: o => o.order_number },
    {
      header: locale === 'bn' ? 'গ্রাহক' : 'Customer',
      accessor: o => <div><p className="text-sm font-medium text-body">{localName(o.shipping_name_bn, o.shipping_name_en, locale === 'bn')}</p><p className="text-xs text-muted flex items-center gap-1">{o.shipping_phone}{o.shipping_phone && <CopyButton value={o.shipping_phone} isBn={locale === 'bn'} />}</p></div>,
      exportValue: o => `${o.shipping_name_en} / ${o.shipping_phone}`,
    },
    {
      header: t('order.total'),
      accessor: o => <span className="font-bold text-amber-700 dark:text-amber-400">{formatAmount(o.grand_total, locale)}</span>,
      exportValue: o => o.grand_total,
    },
    {
      header: locale === 'bn' ? 'পেমেন্ট' : 'Payment',
      accessor: o => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted">
            <span>{o.payment_method === 'COD' ? '💵' : '💳'}</span>
            <span>{o.payment_method === 'COD' ? 'COD' : (locale === 'bn' ? 'অনলাইন' : 'Online')}</span>
          </div>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${o.payment_status === 'PAID' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'}`}>
            {o.payment_status === 'PAID' ? (locale === 'bn' ? 'পেইড' : 'Paid') : (locale === 'bn' ? 'আনপেইড' : 'Unpaid')}
          </span>
        </div>
      ),
      exportValue: o => `${o.payment_method} / ${o.payment_status}`,
    },
    { header: t('order.status'), accessor: o => <OrderStatusCell order={o} locale={locale} />, exportValue: o => o.status },
    {
      header: locale === 'bn' ? 'উৎস' : 'Source',
      accessor: o => <OrderSourceBadge source={o.source} locale={locale} />,
      exportValue: o => o.source,
    },
    {
      header: locale === 'bn' ? 'তারিখ' : 'Date',
      accessor: o => <span className="text-xs text-muted whitespace-nowrap">{formatDateTime(o.created_at, locale)}</span>,
      exportValue: o => new Date(o.created_at).toLocaleString(),
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('admin.orders')}
        description={locale === 'bn' ? 'সকল গ্রাহকের অর্ডার দেখুন, প্রক্রিয়া করুন ও পরিচালনা করুন' : 'View, process and manage all customer orders'}
        addLabel="POS"
        onAdd={() => router.push(`/${locale}/admin/orders/new`)}
        actions={
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-400">
                <X className="w-3.5 h-3.5" />{locale === 'bn' ? 'ক্লিয়ার' : 'Clear'}
              </button>
            )}
            <button onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${showFilters || activeCount > 0 ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-400' : 'bg-background border-border text-muted hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-700 dark:hover:text-amber-400'}`}>
              <Filter className="w-3.5 h-3.5" />
              {locale === 'bn' ? 'ফিল্টার' : 'Filter'}
              {activeCount > 0 && <span className="bg-amber-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">{activeCount}</span>}
            </button>
          </div>
        } />

      {showFilters && (
        <form
          onSubmit={e => { e.preventDefault(); handleSubmit() }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit() } }}
          className="mb-5 p-4 bg-surface rounded-2xl grid grid-cols-2 sm:grid-cols-3 gap-3">
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
          <FloatingSelect label={locale === 'bn' ? 'উৎস' : 'Source'} value={draft.source} onChange={set('source')}>
            <option value="">{t('common.all')}</option>
            {SOURCES.map(s => <option key={s} value={s}>{locale === 'bn' ? SOURCE_LABELS[s].bn : SOURCE_LABELS[s].en}</option>)}
          </FloatingSelect>
          <FloatingDatePicker label={locale === 'bn' ? 'শুরু তারিখ' : 'From Date'} value={draft.from} onChange={set('from')} clearable />
          <FloatingDatePicker label={locale === 'bn' ? 'শেষ তারিখ' : 'To Date'} value={draft.to} onChange={set('to')} clearable />
          <div className="flex items-center"><button type="submit" className="btn-primary w-full">{locale === 'bn' ? 'খুঁজুন' : 'Apply'}</button></div>
        </form>
      )}

      <ReusableTable data={data?.data ?? []} columns={columns} keyExtractor={o => o.id}
        isLoading={isLoading || isFetching} totalPages={data?.pagination?.total_pages ?? 1}
        totalRecords={data?.pagination?.total} currentPage={page} onPageChange={setPage}
        limit={limit} onLimitChange={l => { setLimit(l); setPage(1) }}
        exportFilename="orders" emptyMessage={locale === 'bn' ? 'কোনো অর্ডার নেই' : 'No orders found'}
        quickActions={[{
          label: t('common.edit'),
          render: o => (
            <Link href={`/${locale}/admin/orders/${o.id}`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              title={t('common.edit')}>
              <Eye className="w-3.5 h-3.5" />
            </Link>
          ),
        }]} />
    </div>
  )
}

'use client'
import { formatAmount } from '@/utils/format'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { useGetProfitLossQuery, useGetTrialBalanceQuery } from '@/api/accounting/accountingApi'
import { FloatingInput } from '@/components/ui/forms'
import PageHeader from '@/components/ui/PageHeader'

export default function ReportsPage() {
  const t      = useTranslations('accounting')
  const locale = useLocale()
  const [from, setFrom] = useState('')
  const [to, setTo]     = useState('')
  const [asOf, setAsOf] = useState('')
  const [tab, setTab]   = useState<'pl' | 'tb' | 'sales'>('pl')

  const { data: pl, isLoading: plLoading } = useGetProfitLossQuery({ from, to }, { skip: tab !== 'pl' })
  const { data: tb, isLoading: tbLoading } = useGetTrialBalanceQuery({ asOf }, { skip: tab !== 'tb' })

  return (
    <div>
      <PageHeader title={locale === 'bn' ? 'রিপোর্ট' : 'Reports'} />

      <div className="flex gap-2 mb-6 border-b">
        {(['pl', 'tb', 'sales'] as const).map((s) => (
          <button key={s} onClick={() => setTab(s)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === s ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {s === 'pl' ? t('profitLoss') : s === 'tb' ? t('trialBalance') : t('salesSummary')}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-6 flex-wrap items-end">
        {tab === 'tb' ? (
          <div className="w-44">
            <FloatingInput label={locale === 'bn' ? 'তারিখ' : 'As of'} type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
          </div>
        ) : (
          <>
            <div className="w-44">
              <FloatingInput label={locale === 'bn' ? 'শুরু তারিখ' : 'From'} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="w-44">
              <FloatingInput label={locale === 'bn' ? 'শেষ তারিখ' : 'To'} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </>
        )}
      </div>

      {tab === 'pl' && (
        plLoading ? <TableSkeleton columns={2} rows={3} /> : pl && (
          <div className="card max-w-sm">
            {[
              { label: t('revenue'),   value: pl.revenue,    color: 'text-green-600' },
              { label: t('expense'),   value: pl.expense,    color: 'text-amber-500' },
              { label: t('netProfit'), value: pl.net_profit, color: Number(pl.net_profit) >= 0 ? 'text-green-700' : 'text-amber-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between py-3 border-b last:border-0">
                <span className="text-gray-700">{label}</span>
                <span className={`font-bold ${color}`}>{formatAmount(value, locale)}</span>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'tb' && (
        tbLoading ? <TableSkeleton columns={4} rows={6} /> : tb && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 border-b border-amber-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{t('account')}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{t('debit')}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{t('credit')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tb.rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.account.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{locale === 'bn' ? r.account.name_bn : r.account.name_en}</td>
                    <td className="px-4 py-3 text-right text-sm">{Number(r.debit)  ? `৳${r.debit}`  : '—'}</td>
                    <td className="px-4 py-3 text-right text-sm">{Number(r.credit) ? `৳${r.credit}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'sales' && (
        <p className="text-gray-400 text-sm">{locale === 'bn' ? 'শীঘ্রই আসছে' : 'Coming soon'}</p>
      )}
    </div>
  )
}

'use client'
import { formatAmount } from '@/utils/format'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { useGetProfitLossQuery, useGetTrialBalanceQuery } from '@/api/accounting/accountingApi'
import { FloatingDatePicker } from '@/components/ui/forms'
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

      <div className="flex gap-3 mb-6 max-w-sm">
        {tab === 'tb' ? (
          <div className="flex-1">
            <FloatingDatePicker label={locale === 'bn' ? 'তারিখ' : 'As of'} value={asOf} onChange={setAsOf} clearable />
          </div>
        ) : (
          <>
            <div className="flex-1">
              <FloatingDatePicker label={locale === 'bn' ? 'শুরু তারিখ' : 'From'} value={from} onChange={setFrom} clearable />
            </div>
            <div className="flex-1">
              <FloatingDatePicker label={locale === 'bn' ? 'শেষ তারিখ' : 'To'} value={to} onChange={setTo} clearable />
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
        tbLoading ? <TableSkeleton columns={4} rows={6} /> : tb && (() => {
          const totalDebit  = tb.rows.reduce((s, r) => s + Number(r.debit),  0)
          const totalCredit = tb.rows.reduce((s, r) => s + Number(r.credit), 0)
          const balanced    = Math.abs(totalDebit - totalCredit) < 0.01
          return (
            <>
              <div className={`flex items-center gap-2 mb-3 px-4 py-2.5 rounded-xl text-sm font-semibold w-fit ${
                balanced
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                <span>{balanced ? '✓' : '✗'}</span>
                <span>
                  {balanced
                    ? (locale === 'bn' ? 'ব্যালেন্স সমান — সঠিক আছে' : 'Balanced — Trial Balance is correct')
                    : (locale === 'bn' ? `ব্যালেন্স মিলছে না — পার্থক্য: ৳${Math.abs(totalDebit - totalCredit).toFixed(2)}` : `Unbalanced — Difference: ৳${Math.abs(totalDebit - totalCredit).toFixed(2)}`)}
                </span>
              </div>
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
                        <td className="px-4 py-3 text-right text-sm">{Number(r.debit)  ? formatAmount(r.debit, locale, 0)  : '—'}</td>
                        <td className="px-4 py-3 text-right text-sm">{Number(r.credit) ? formatAmount(r.credit, locale, 0) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-amber-200 bg-amber-50">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-xs font-bold text-gray-700 uppercase">
                        {locale === 'bn' ? 'মোট' : 'Total'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">{formatAmount(totalDebit, locale, 0)}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">{formatAmount(totalCredit, locale, 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )
        })()
      )}

      {tab === 'sales' && (
        <p className="text-gray-400 text-sm">{locale === 'bn' ? 'শীঘ্রই আসছে' : 'Coming soon'}</p>
      )}
    </div>
  )
}

'use client'

import { useGetJournalEntriesQuery } from '@/api/accounting/accountingApi'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { formatAmount } from '@/utils/format'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

export default function JournalPage() {
  const t      = useTranslations('accounting')
  const locale = useLocale()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useGetJournalEntriesQuery({ page })
  const entries    = data?.data ?? []
  const totalPages = data?.meta?.total_pages ?? 1

  return (
    <div>
      <PageHeader title={t('journal')} />

      {isLoading ? <TableSkeleton columns={6} rows={8} /> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  {locale === 'bn' ? 'জার্নাল নং' : 'Entry #'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  {locale === 'bn' ? 'বিবরণ' : 'Description'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  {locale === 'bn' ? 'অ্যাকাউন্ট' : 'Account'}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  {t('debit')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  {t('credit')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  {locale === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  {locale === 'bn' ? 'তারিখ' : 'Date'}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    {locale === 'bn' ? 'কোনো এন্ট্রি নেই' : 'No journal entries'}
                  </td>
                </tr>
              )}

              {entries.map((entry, ei) => (
                entry.lines.map((line, li) => {
                  const isFirst = li === 0
                  const isLast  = li === entry.lines.length - 1
                  const isEven  = ei % 2 === 0

                  return (
                    <tr
                      key={line.id}
                      className={`border-b ${isLast ? 'border-gray-200' : 'border-gray-50'} ${isEven ? 'bg-white' : 'bg-gray-50/40'}`}
                    >
                      {/* Entry # — only on first line */}
                      <td className="px-4 py-2 font-mono text-xs text-gray-400 align-top">
                        {isFirst ? entry.entry_number : ''}
                      </td>

                      {/* Description — only on first line */}
                      <td className="px-4 py-2 text-gray-800 font-medium align-top max-w-[180px] truncate">
                        {isFirst ? (locale === 'bn' ? entry.description_bn : entry.description_en) : ''}
                      </td>

                      {/* Account */}
                      <td className="px-4 py-2 text-gray-700">
                        <span className="font-mono text-gray-400 text-xs mr-1.5">{line.account_code}</span>
                        {locale === 'bn' ? line.account_name_bn : line.account_name_en}
                      </td>

                      {/* Debit */}
                      <td className="px-4 py-2 text-right font-bold text-gray-800">
                        {Number(line.debit) ? formatAmount(line.debit, locale, 0) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Credit */}
                      <td className="px-4 py-2 text-right font-bold text-gray-800">
                        {Number(line.credit) ? formatAmount(line.credit, locale, 0) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Status — only on first line */}
                      <td className="px-4 py-2 text-center align-top">
                        {isFirst && (
                          <Badge variant={entry.is_posted ? 'green' : 'gray'}>
                            {entry.is_posted
                              ? (locale === 'bn' ? 'পোস্টেড' : 'Posted')
                              : (locale === 'bn' ? 'ড্রাফট' : 'Draft')}
                          </Badge>
                        )}
                      </td>

                      {/* Date — only on first line */}
                      <td className="px-4 py-2 text-xs text-gray-500 align-top">
                        {isFirst ? new Date(entry.created_at).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US') : ''}
                      </td>
                    </tr>
                  )
                })
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {locale === 'bn' ? `পেজ ${page} / ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  {locale === 'bn' ? 'পূর্ববর্তী' : 'Prev'}
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  {locale === 'bn' ? 'পরবর্তী' : 'Next'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

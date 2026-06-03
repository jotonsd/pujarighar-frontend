'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin/accounting/journal', label_bn: 'জার্নাল',  label_en: 'Journal' },
  { href: '/admin/accounting/ledger',  label_bn: 'খাতা',     label_en: 'Ledger' },
  { href: '/admin/accounting/reports', label_bn: 'রিপোর্ট', label_en: 'Reports' },
]

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  const locale   = useLocale()
  const pathname = usePathname()

  return (
    <div>
      {/* Sub-tab navigation */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map(tab => {
          const full   = `/${locale}${tab.href}`
          const active = pathname === full || pathname.startsWith(full + '/')
          return (
            <Link
              key={tab.href}
              href={full}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {locale === 'bn' ? tab.label_bn : tab.label_en}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}

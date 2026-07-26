'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import Cookies from 'js-cookie'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const path   = usePathname()
  const user   = useAuthStore((s) => s.user)

  // Reflects the click instantly — the actual page swap (via router.push below)
  // lands a moment later once the new locale route finishes loading, so deriving
  // the thumb position purely from `locale` left a visible gap/blink in between.
  const [pendingLocale, setPendingLocale] = useState<string | null>(null)
  const isBn = (pendingLocale ?? locale) === 'bn'

  useEffect(() => {
    if (pendingLocale === locale) setPendingLocale(null)
  }, [locale, pendingLocale])

  const toggle = async () => {
    const next = isBn ? 'en' : 'bn'
    setPendingLocale(next)
    Cookies.set('locale', next, { expires: 365 })

    if (user) {
      try {
        await api.patch('/api/users/me/', { preferred_language: next })
      } catch {}
    }

    const newPath = path.replace(`/${locale}`, `/${next}`)
    router.push(newPath)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isBn}
      title="Switch language"
      className="relative inline-flex items-center h-7 w-16 shrink-0 rounded-full bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-colors"
    >
      <span
        className={`absolute left-0.5 h-6 w-[30px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
          isBn ? 'translate-x-0' : 'translate-x-[30px]'
        }`}
      />
      <span className={`relative z-10 w-8 text-center text-[11px] font-bold transition-colors ${isBn ? 'text-amber-700' : 'text-gray-400'}`}>
        বাং
      </span>
      <span className={`relative z-10 w-8 text-center text-[11px] font-bold transition-colors ${isBn ? 'text-gray-400' : 'text-amber-700'}`}>
        EN
      </span>
    </button>
  )
}

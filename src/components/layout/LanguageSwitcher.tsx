'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import Cookies from 'js-cookie'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const path   = usePathname()
  const user   = useAuthStore((s) => s.user)

  const toggle = async () => {
    const next = locale === 'bn' ? 'en' : 'bn'
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
      onClick={toggle}
      className="text-sm border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors"
      title="Switch language"
    >
      {locale === 'bn' ? 'EN' : 'বাং'}
    </button>
  )
}

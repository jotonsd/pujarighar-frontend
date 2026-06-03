'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { useLoginMutation } from '@/api/auth/authApi'
import { FloatingInput } from '@/components/ui/forms'

export default function LoginPage() {
  const t       = useTranslations()
  const locale  = useLocale()
  const router  = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [form, setForm] = useState({ email: '', password: '' })
  const [login, { isLoading }] = useLoginMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = await login(form).unwrap()
      setAuth(data.user, data.access, data.refresh)
      toast.success(locale === 'bn' ? 'সফলভাবে লগইন হয়েছে' : 'Logged in successfully')
      const role = data.user?.role
      if (role === 'ADMIN' || role === 'WAREHOUSE') {
        router.push(`/${locale}/admin/orders/new`)
      } else {
        router.push(`/${locale}`)
      }
    } catch (err: unknown) {
      const e = err as { data?: { errors?: { details?: { message_bn?: string; message_en?: string } } } }
      toast.error(locale === 'bn'
        ? (e.data?.errors?.details?.message_bn ?? 'লগইন ব্যর্থ হয়েছে')
        : (e.data?.errors?.details?.message_en ?? 'Login failed'))
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('auth.login')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FloatingInput
            label={t('auth.email')}
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <FloatingInput
            label={t('auth.password')}
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? t('common.loading') : t('auth.login')}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-500">
          <Link href={`/${locale}/auth/register`} className="text-amber-600 hover:underline">
            {t('auth.loginPrompt')}
          </Link>
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { useRegisterMutation } from '@/api/auth/authApi'
import { FloatingInput } from '@/components/ui/forms'

export default function RegisterPage() {
  const t       = useTranslations()
  const locale  = useLocale()
  const router  = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [form, setForm] = useState({ email: '', phone: '', password: '', full_name_bn: '', full_name_en: '' })
  const [register, { isLoading }] = useRegisterMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = await register(form).unwrap()
      setAuth(data.user, data.access, data.refresh)
      toast.success(locale === 'bn' ? 'নিবন্ধন সফল হয়েছে' : 'Registration successful')
      router.push(`/${locale}`)
    } catch (err: unknown) {
      const e = err as { data?: { errors?: { details?: { message_bn?: string; message_en?: string } } } }
      toast.error(locale === 'bn'
        ? (e.data?.errors?.details?.message_bn ?? 'নিবন্ধন ব্যর্থ হয়েছে')
        : (e.data?.errors?.details?.message_en ?? 'Registration failed'))
    }
  }

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value })

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('auth.register')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FloatingInput label={t('auth.fullNameBn')} required value={form.full_name_bn} onChange={f('full_name_bn')} />
            <FloatingInput label={t('auth.fullNameEn')} value={form.full_name_en} onChange={f('full_name_en')} />
          </div>
          <FloatingInput label={t('auth.email')} type="email" required value={form.email} onChange={f('email')} />
          <FloatingInput label={t('auth.phone')} required value={form.phone} onChange={f('phone')} placeholder="01XXXXXXXXX" />
          <FloatingInput label={t('auth.password')} type="password" required value={form.password} onChange={f('password')} />
          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? t('common.loading') : t('auth.register')}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-500">
          <Link href={`/${locale}/auth/login`} className="text-amber-600 hover:underline">{t('auth.registerPrompt')}</Link>
        </p>
      </div>
    </div>
  )
}

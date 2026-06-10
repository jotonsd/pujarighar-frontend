'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Role } from '@/lib/types'
import { useCreateUserMutation } from '@/api/users/usersApi'
import { FloatingInput, FloatingSelect } from '@/components/ui/forms'
import PageHeader from '@/components/ui/PageHeader'

const ROLES: Role[] = ['ADMIN', 'WAREHOUSE', 'DELIVERY', 'CUSTOMER']

export default function NewUserPage() {
  const t      = useTranslations()
  const locale = useLocale()
  const router = useRouter()

  const [form, setForm] = useState({ email: '', phone: '', password: '', role: 'CUSTOMER' as Role, full_name_bn: '' })
  const [error, setError] = useState('')

  const [createUser, { isLoading }] = useCreateUserMutation()

  const handleCreate = async () => {
    setError('')
    try {
      await createUser(form).unwrap()
      router.push(`/${locale}/admin/users`)
    } catch (err: unknown) {
      const e = err as { data?: { error?: { message_en?: string } } }
      setError(e.data?.error?.message_en ?? 'Failed')
    }
  }

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }))

  return (
    <div className="max-w-7xl">
      <PageHeader
        title={`${t('common.create')} ${locale === 'bn' ? 'ব্যবহারকারী' : 'User'}`}
        description={locale === 'bn' ? 'নতুন ব্যবহারকারী অ্যাকাউন্ট তৈরি করুন ও ভূমিকা নির্ধারণ করুন' : 'Create a new user account and assign their role'}
        showBack
      />
      {error && <p className="text-amber-500 text-sm mb-4 bg-amber-50 p-3 rounded-lg">{error}</p>}

      <div className="card space-y-4">
        <FloatingInput label={t('auth.email')} type="email" required value={form.email} onChange={f('email')} />
        <FloatingInput label={t('auth.phone')} required value={form.phone} onChange={f('phone')} />
        <FloatingInput label={t('auth.password')} type="password" required value={form.password} onChange={f('password')} />
        <FloatingInput label="Full Name (Bangla)" value={form.full_name_bn} onChange={f('full_name_bn')} />
        <FloatingSelect label="Role" value={form.role} onChange={(val) => setForm((p) => ({ ...p, role: val as Role }))}>
          {ROLES.map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}
        </FloatingSelect>
        <div className="flex gap-3">
          <button onClick={handleCreate} disabled={isLoading} className="btn-primary">
            {isLoading ? t('common.loading') : t('common.create')}
          </button>
          <button onClick={() => router.back()} className="btn-secondary">{t('common.cancel')}</button>
        </div>
      </div>
    </div>
  )
}

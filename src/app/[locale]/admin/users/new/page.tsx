'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCreateUserMutation } from '@/api/users/usersApi'
import { useGetRolesQuery } from '@/api/roles/rolesApi'
import { FloatingInput, FloatingSelect } from '@/components/ui/forms'
import PageHeader from '@/components/ui/PageHeader'
import { getErrorMessage, getFieldErrors } from '@/utils/apiError'

export default function NewUserPage() {
  const t      = useTranslations()
  const locale = useLocale()
  const isBn   = locale === 'bn'
  const router = useRouter()

  const { data: roles = [] } = useGetRolesQuery()
  const [form, setForm] = useState({ email: '', phone: '', password: '', role: '', full_name_bn: '' })

  useEffect(() => {
    if (!form.role && roles.length) {
      const customer = roles.find(r => r.code === 'CUSTOMER')
      setForm(p => ({ ...p, role: customer?.id ?? roles[0].id }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles])

  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [createUser, { isLoading }] = useCreateUserMutation()

  const handleCreate = async () => {
    setError('')
    setFieldErrors({})
    try {
      await createUser(form).unwrap()
      router.push(`/${locale}/admin/users`)
    } catch (err: unknown) {
      setError(getErrorMessage(err, locale))
      setFieldErrors(getFieldErrors(err))
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
        <FloatingInput label={t('auth.email')} type="email" required value={form.email} onChange={f('email')} error={fieldErrors.email} />
        <FloatingInput label={t('auth.phone')} required value={form.phone} onChange={f('phone')} error={fieldErrors.phone} />
        <FloatingInput label={t('auth.password')} type="password" required value={form.password} onChange={f('password')} error={fieldErrors.password} />
        <FloatingInput label="Full Name (Bangla)" value={form.full_name_bn} onChange={f('full_name_bn')} error={fieldErrors.full_name_bn} />
        <FloatingSelect label="Role" value={form.role} onChange={(val) => setForm((p) => ({ ...p, role: val }))} error={fieldErrors.role}>
          {roles.map((r) => <option key={r.id} value={r.id}>{isBn ? r.name_bn : r.name_en}</option>)}
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

'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Role } from '@/lib/types'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import { toast } from '@/store/toastStore'
import {
  useGetUserQuery,
  useChangeRoleMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
} from '@/api/users/usersApi'
import { FloatingSelect } from '@/components/ui/forms'

const ROLES: Role[] = ['ADMIN', 'WAREHOUSE', 'DELIVERY', 'CUSTOMER']
const roleVariants: Record<Role, 'blue' | 'yellow' | 'orange' | 'green'> = {
  ADMIN: 'blue', WAREHOUSE: 'yellow', DELIVERY: 'orange', CUSTOMER: 'green',
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const t      = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const [newRole, setNewRole] = useState<Role | ''>('')

  const { data: user, isLoading }         = useGetUserQuery(params.id)
  const [changeRole, { isLoading: changingRole }] = useChangeRoleMutation()
  const [activate]   = useActivateUserMutation()
  const [deactivate] = useDeactivateUserMutation()

  const handleChangeRole = async () => {
    if (!newRole) return
    try {
      await changeRole({ id: params.id, role: newRole }).unwrap()
      toast.success(locale === 'bn' ? 'রোল পরিবর্তন হয়েছে' : 'Role updated')
    } catch {
      toast.error('Failed')
    }
  }

  const toggleActive = () =>
    user?.is_active ? deactivate(params.id) : activate(params.id)

  if (isLoading || !user) return <Spinner />

  return (
    <div className="max-w-7xl">
      <PageHeader
        title={user.profile?.full_name_bn || user.email}
        description={`${user.email} · ${user.phone}`}
        showBack
        actions={<Badge variant={roleVariants[user.role]}>{t(`role.${user.role}`)}</Badge>}
      />

      <div className="card space-y-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <FloatingSelect label="Change Role" value={newRole} onChange={(val) => setNewRole(val as Role)}>
              <option value="">Select role</option>
              {ROLES.map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}
            </FloatingSelect>
          </div>
          <button onClick={handleChangeRole} disabled={!newRole || changingRole} className="btn-primary whitespace-nowrap">
            {changingRole ? t('common.loading') : t('common.save')}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">{user.is_active ? t('common.active') : t('common.inactive')}</span>
          <button onClick={toggleActive} className={user.is_active ? 'btn-secondary text-sm' : 'btn-primary text-sm'}>
            {user.is_active ? t('common.inactive') : t('common.active')}
          </button>
        </div>
      </div>
    </div>
  )
}

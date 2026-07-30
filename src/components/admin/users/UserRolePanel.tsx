'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { User } from '@/lib/types'
import { toast } from '@/store/toastStore'
import { FloatingSelect } from '@/components/ui/forms'
import { useChangeRoleMutation, useActivateUserMutation, useDeactivateUserMutation } from '@/api/users/usersApi'
import { useGetRolesQuery } from '@/api/roles/rolesApi'

interface Props {
  user: User
}

export default function UserRolePanel({ user }: Props) {
  const t      = useTranslations()
  const locale = useLocale()
  const isBn   = locale === 'bn'
  const [newRole, setNewRole] = useState('')

  const { data: roles = [] } = useGetRolesQuery()
  const [changeRole, { isLoading: changingRole }] = useChangeRoleMutation()
  const [activate]   = useActivateUserMutation()
  const [deactivate] = useDeactivateUserMutation()

  const handleChangeRole = async () => {
    if (!newRole) return
    try {
      await changeRole({ id: user.id, role: newRole }).unwrap()
      toast.success(locale === 'bn' ? 'রোল পরিবর্তন হয়েছে' : 'Role updated')
    } catch {
      toast.error('Failed')
    }
  }

  const toggleActive = () => user.is_active ? deactivate(user.id) : activate(user.id)

  return (
    <div className="card space-y-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <FloatingSelect label="Change Role" value={newRole} onChange={val => setNewRole(val)}>
            <option value="">Select role</option>
            {roles.map(r => <option key={r.id} value={r.id}>{isBn ? r.name_bn : r.name_en}</option>)}
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
  )
}

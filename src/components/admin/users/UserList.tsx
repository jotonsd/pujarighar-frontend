'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import ToggleSwitch from '@/components/ui/forms/ToggleSwitch'
import PageHeader from '@/components/ui/PageHeader'
import { ReusableTable, Column } from '@/components/ui/ReusableTable'
import { FloatingInput, FloatingSelect } from '@/components/ui/forms'
import { User } from '@/lib/types'
import { useAuthStore } from '@/store/authStore'
import { useGetUsersQuery, useActivateUserMutation, useDeactivateUserMutation } from '@/api/users/usersApi'
import { useGetRolesQuery } from '@/api/roles/rolesApi'

const SYSTEM_ROLE_VARIANTS: Record<string, 'blue' | 'yellow' | 'orange' | 'green'> = {
  ADMIN: 'blue', WAREHOUSE: 'yellow', DELIVERY: 'orange', CUSTOMER: 'green',
}

export default function UserList() {
  const t      = useTranslations()
  const locale = useLocale()
  const isBn   = locale === 'bn'
  const [page, setPage]     = useState(1)
  const [limit, setLimit]   = useState(10)
  const [role, setRole]     = useState('')
  const [search, setSearch] = useState('')

  const currentUserId = useAuthStore(s => s.user?.id)
  const { data, isLoading, isFetching } = useGetUsersQuery({ page, page_size: limit, role, search })
  const { data: roles = [] } = useGetRolesQuery()
  const [activate]   = useActivateUserMutation()
  const [deactivate] = useDeactivateUserMutation()

  const toggle = (id: string, isActive: boolean) => isActive ? deactivate(id) : activate(id)

  const columns: Column<User>[] = [
    { header: t('auth.email'), accessor: 'email', className: 'px-4 py-3 text-sm text-gray-800 font-medium', exportValue: u => u.email },
    { header: t('auth.phone'), accessor: 'phone', className: 'px-4 py-3 text-sm text-gray-600', exportValue: u => u.phone },
    {
      header: 'Role',
      accessor: u => (
        <Badge variant={(u.role.code && SYSTEM_ROLE_VARIANTS[u.role.code]) || 'gray'}>
          {isBn ? u.role.name_bn : u.role.name_en}
        </Badge>
      ),
      exportValue: u => isBn ? u.role.name_bn : u.role.name_en,
    },
    {
      header: locale === 'bn' ? 'স্ট্যাটাস' : 'Status',
      accessor: u => (
        <ToggleSwitch checked={u.is_active} onChange={() => toggle(u.id, u.is_active)}
          disabled={u.id === currentUserId}
          disabledTitle={locale === 'bn' ? 'নিজের অ্যাকাউন্ট পরিবর্তন করা যাবে না' : 'Cannot toggle your own account'}
          activeLabel={locale === 'bn' ? 'সক্রিয়' : 'Active'} inactiveLabel={locale === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'} />
      ),
      exportValue: u => u.is_active ? 'Active' : 'Inactive',
      className: 'px-4 py-3 w-36',
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('admin.users')}
        description={locale === 'bn' ? 'সকল ব্যবহারকারীর তালিকা, ভূমিকা ও অ্যাকাউন্ট পরিচালনা' : 'Manage all user accounts, roles and access'}
        actions={
          <Link href={`/${locale}/admin/users/new`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-600 text-white transition-colors">
            {t('common.create')}
          </Link>
        }
      />

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="w-64">
          <FloatingInput label={t('common.search')} value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <div className="w-48">
          <FloatingSelect label="Role" value={role} onChange={val => { setRole(val); setPage(1) }}>
            <option value="">{t('common.all')}</option>
            {roles.map(r => <option key={r.id} value={r.id}>{isBn ? r.name_bn : r.name_en}</option>)}
          </FloatingSelect>
        </div>
      </div>

      <ReusableTable data={data?.data ?? []} columns={columns} keyExtractor={u => u.id}
        isLoading={isLoading || isFetching} totalPages={data?.pagination?.total_pages ?? 1}
        totalRecords={data?.pagination?.total} currentPage={page} onPageChange={setPage}
        exportFilename="users" emptyMessage={locale === 'bn' ? 'কোনো ব্যবহারকারী নেই' : 'No users found'}
        quickActions={[{
          label: t('common.edit'),
          render: u => (
            <Link href={`/${locale}/admin/users/${u.id}`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
              title={t('common.edit')}>
              <Pencil className="w-3.5 h-3.5" />
            </Link>
          ),
        }]} />
    </div>
  )
}

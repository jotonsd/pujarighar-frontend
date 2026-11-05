'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import ToggleSwitch from '@/components/ui/forms/ToggleSwitch'
import PageHeader from '@/components/ui/PageHeader'
import { ReusableTable, Column } from '@/components/ui/ReusableTable'
import { FloatingInput, FloatingSelect } from '@/components/ui/forms'
import { User } from '@/lib/types'
import { formatDateTime } from '@/utils/format'
import { useAuthStore } from '@/store/authStore'
import { useGetUsersQuery, useActivateUserMutation, useDeactivateUserMutation, useHardDeleteUserMutation } from '@/api/users/usersApi'
import { useGetRolesQuery } from '@/api/roles/rolesApi'
import { toast } from '@/store/toastStore'
import { getErrorMessage } from '@/utils/apiError'
import { hasPermission } from '@/utils/permissions'
import DeleteUserConfirmModal from './DeleteUserConfirmModal'

const SYSTEM_ROLE_VARIANTS: Record<string, 'blue' | 'yellow' | 'orange' | 'green'> = {
  ADMIN: 'blue', WAREHOUSE: 'yellow', DELIVERY: 'orange', CUSTOMER: 'green',
}

const SIGNUP_PROVIDER_VARIANTS: Record<string, 'blue' | 'gray' | 'green'> = {
  GOOGLE: 'blue', FACEBOOK: 'blue', MANUAL: 'gray',
}
const SIGNUP_PROVIDER_LABELS: Record<string, { bn: string; en: string }> = {
  MANUAL: { bn: 'সাধারণ', en: 'Manual' },
  GOOGLE: { bn: 'Google', en: 'Google' },
  FACEBOOK: { bn: 'Facebook', en: 'Facebook' },
}

export default function UserList() {
  const t      = useTranslations()
  const locale = useLocale()
  const isBn   = locale === 'bn'
  const [page, setPage]     = useState(1)
  const [limit, setLimit]   = useState(10)
  const [role, setRole]     = useState('')
  const [search, setSearch] = useState('')
  const [registeredVia, setRegisteredVia] = useState('')

  const currentUser   = useAuthStore(s => s.user)
  const currentUserId = currentUser?.id
  const canDeleteUsers = hasPermission(currentUser, 'users_admin', 'delete')
  const { data, isLoading, isFetching } = useGetUsersQuery({ page, page_size: limit, role, search, registered_via: registeredVia })
  const { data: roles = [] } = useGetRolesQuery()
  const [activate]   = useActivateUserMutation()
  const [deactivate] = useDeactivateUserMutation()
  const [hardDelete, { isLoading: deleting }] = useHardDeleteUserMutation()
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const toggle = (id: string, isActive: boolean) => isActive ? deactivate(id) : activate(id)

  const confirmHardDelete = async () => {
    if (!deleteTarget) return
    try {
      await hardDelete(deleteTarget.id).unwrap()
      toast.success(isBn ? 'ব্যবহারকারী স্থায়ীভাবে মুছে ফেলা হয়েছে' : 'User permanently deleted')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(getErrorMessage(err, locale))
    }
  }

  const nameFor = (u: User) =>
    (isBn ? u.profile?.full_name_bn || u.profile?.full_name_en : u.profile?.full_name_en || u.profile?.full_name_bn)
    || '—'

  const columns: Column<User>[] = [
    {
      header: locale === 'bn' ? 'নাম' : 'Name',
      accessor: u => nameFor(u),
      className: 'px-4 py-3 text-sm text-body font-medium',
      exportValue: nameFor,
    },
    { header: t('auth.email'), accessor: 'email', className: 'px-4 py-3 text-sm text-body font-medium', exportValue: u => u.email },
    { header: t('auth.phone'), accessor: 'phone', className: 'px-4 py-3 text-sm text-muted', exportValue: u => u.phone },
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
      header: locale === 'bn' ? 'প্ল্যাটফর্ম' : 'Platform',
      accessor: u => (
        <Badge variant={u.registered_via === 'MOBILE_APP' ? 'blue' : 'gray'}>
          {u.registered_via === 'MOBILE_APP'
            ? (locale === 'bn' ? 'অ্যাপ' : 'App')
            : (locale === 'bn' ? 'ওয়েবসাইট' : 'Website')}
        </Badge>
      ),
      exportValue: u => u.registered_via === 'MOBILE_APP' ? 'App' : 'Website',
    },
    {
      header: locale === 'bn' ? 'সাইনআপ' : 'Signup',
      accessor: u => (
        <Badge variant={SIGNUP_PROVIDER_VARIANTS[u.signup_provider] || 'gray'}>
          {SIGNUP_PROVIDER_LABELS[u.signup_provider]?.[isBn ? 'bn' : 'en'] ?? u.signup_provider}
        </Badge>
      ),
      exportValue: u => u.signup_provider,
    },
    {
      header: locale === 'bn' ? 'নিবন্ধনের তারিখ' : 'Registered',
      accessor: u => (
        <span className="text-sm text-muted whitespace-nowrap">{formatDateTime(u.date_joined, locale)}</span>
      ),
      exportValue: u => formatDateTime(u.date_joined, locale),
    },
    {
      header: locale === 'bn' ? 'স্ট্যাটাস' : 'Status',
      accessor: u => (
        <ToggleSwitch checked={u.is_active} onChange={() => toggle(u.id, u.is_active)}
          disabled={u.id === currentUserId}
          disabledTitle={locale === 'bn' ? 'নিজের অ্যাকাউন্ট পরিবর্তন করা যাবে না' : 'Cannot toggle your own account'} />
      ),
      exportValue: u => u.is_active ? 'Active' : 'Inactive',
      className: 'px-4 py-3 w-16',
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

      <div className="flex gap-3 mb-4 flex-wrap items-center">
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
        <div className="w-48">
          <FloatingSelect label={locale === 'bn' ? 'প্ল্যাটফর্ম' : 'Platform'} value={registeredVia}
            onChange={val => { setRegisteredVia(val); setPage(1) }}>
            <option value="">{t('common.all')}</option>
            <option value="MOBILE_APP">{locale === 'bn' ? 'অ্যাপ' : 'Mobile App'}</option>
            <option value="WEBSITE">{locale === 'bn' ? 'ওয়েবসাইট' : 'Website'}</option>
          </FloatingSelect>
        </div>
        {data?.meta?.platform_counts && (
          <>
            <div className="px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-400">
              <span className="font-semibold">{data.meta.platform_counts.mobile_app}</span>{' '}
              {locale === 'bn' ? 'জন অ্যাপ ব্যবহারকারী' : 'app users'}
            </div>
            <div className="px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-muted">
              <span className="font-semibold">{data.meta.platform_counts.website}</span>{' '}
              {locale === 'bn' ? 'জন ওয়েবসাইট ব্যবহারকারী' : 'website users'}
            </div>
          </>
        )}
      </div>

      <ReusableTable data={data?.data ?? []} columns={columns} keyExtractor={u => u.id}
        isLoading={isLoading || isFetching} totalPages={data?.pagination?.total_pages ?? 1}
        totalRecords={data?.pagination?.total} currentPage={page} onPageChange={setPage}
        limit={limit} onLimitChange={l => { setLimit(l); setPage(1) }}
        exportFilename="users" emptyMessage={locale === 'bn' ? 'কোনো ব্যবহারকারী নেই' : 'No users found'}
        quickActions={[
          {
            label: t('common.edit'),
            render: u => (
              <Link href={`/${locale}/admin/users/${u.id}`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                title={t('common.edit')}>
                <Pencil className="w-3.5 h-3.5" />
              </Link>
            ),
          },
          // Permission-gated ('users_admin'.'delete' — grantable to a
          // custom role via Admin > Roles, same as the backend check) rather
          // than hardcoded to ADMIN — permanently removes the row, unlike
          // the Status toggle above which only deactivates. Hidden for the
          // viewer's own account, same as the Status toggle's disabled state.
          ...(canDeleteUsers ? [{
            label: isBn ? 'স্থায়ীভাবে মুছুন' : 'Delete Permanently',
            show: (u: User) => u.id !== currentUserId,
            render: (u: User) => (
              <button
                onClick={() => setDeleteTarget(u)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                title={isBn ? 'স্থায়ীভাবে মুছুন' : 'Delete Permanently'}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ),
          }] : []),
        ]} />

      {deleteTarget && (
        <DeleteUserConfirmModal
          locale={locale}
          userName={nameFor(deleteTarget) !== '—' ? nameFor(deleteTarget) : deleteTarget.email}
          loading={deleting}
          onConfirm={confirmHardDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

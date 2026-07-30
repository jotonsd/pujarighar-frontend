'use client'

import { useLocale } from 'next-intl'
import { UserDetailSkeleton } from '@/components/ui/skeletons'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import UserRolePanel from '@/components/admin/users/UserRolePanel'
import { useGetUserQuery } from '@/api/users/usersApi'

const SYSTEM_ROLE_VARIANTS: Record<string, 'blue' | 'yellow' | 'orange' | 'green'> = {
  ADMIN: 'blue', WAREHOUSE: 'yellow', DELIVERY: 'orange', CUSTOMER: 'green',
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const locale = useLocale()
  const isBn   = locale === 'bn'
  const { data: user, isLoading } = useGetUserQuery(params.id)

  if (isLoading || !user) return <UserDetailSkeleton />

  return (
    <div className="max-w-7xl">
      <PageHeader
        title={user.profile?.full_name_bn || user.email}
        description={`${user.email} · ${user.phone}`}
        showBack
        actions={
          <Badge variant={(user.role.code && SYSTEM_ROLE_VARIANTS[user.role.code]) || 'gray'}>
            {isBn ? user.role.name_bn : user.role.name_en}
          </Badge>
        } />
      <UserRolePanel user={user} />
    </div>
  )
}

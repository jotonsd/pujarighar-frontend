'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Role } from '@/lib/types'
import { UserDetailSkeleton } from '@/components/ui/skeletons'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import UserRolePanel from '@/components/admin/users/UserRolePanel'
import { useGetUserQuery } from '@/api/users/usersApi'

const roleVariants: Record<Role, 'blue' | 'yellow' | 'orange' | 'green'> = {
  ADMIN: 'blue', WAREHOUSE: 'yellow', DELIVERY: 'orange', CUSTOMER: 'green',
}

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const t      = useTranslations()
  const locale = useLocale()
  const { data: user, isLoading } = useGetUserQuery(params.id)

  if (isLoading || !user) return <UserDetailSkeleton />

  return (
    <div className="max-w-7xl">
      <PageHeader
        title={user.profile?.full_name_bn || user.email}
        description={`${user.email} · ${user.phone}`}
        showBack
        actions={<Badge variant={roleVariants[user.role]}>{t(`role.${user.role}`)}</Badge>} />
      <UserRolePanel user={user} />
    </div>
  )
}

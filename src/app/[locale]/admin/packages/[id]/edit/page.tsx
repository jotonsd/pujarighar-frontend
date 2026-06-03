'use client'

import Spinner from '@/components/ui/Spinner'
import PackageForm from '@/components/admin/PackageForm'
import { useGetProductQuery } from '@/api/products/productsApi'

export default function EditPackagePage({ params }: { params: { id: string } }) {
  const { data: pkg, isLoading } = useGetProductQuery(params.id)

  if (isLoading || !pkg) return <Spinner />

  return <PackageForm mode="edit" package={pkg} />
}

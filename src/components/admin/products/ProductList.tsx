'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import ToggleSwitch from '@/components/ui/forms/ToggleSwitch'
import PageHeader from '@/components/ui/PageHeader'
import { ReusableTable, Column } from '@/components/ui/ReusableTable'
import { FloatingInput, FloatingSelect } from '@/components/ui/forms'
import { Product } from '@/lib/types'
import { toast } from '@/store/toastStore'
import { formatNumber } from '@/utils/format'
import { useGetBrandsQuery } from '@/api/brands/brandsApi'
import { useGetCategoriesQuery } from '@/api/categories/categoriesApi'
import { useGetProductsQuery, useUpdateProductMutation } from '@/api/products/productsApi'
import { useAuthStore } from '@/store/authStore'

export default function ProductList() {
  const t      = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const isAdmin = useAuthStore(s => s.user?.role === 'ADMIN')
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('')
  const [brand, setBrand]         = useState('')
  const [isPackage, setIsPackage] = useState('')
  const [limit, setLimit]         = useState(10)

  const { data: categories = [] } = useGetCategoriesQuery()
  const { data: brands = [] }     = useGetBrandsQuery()
  const { data, isLoading } = useGetProductsQuery({ page, search, category, brand, is_package: isPackage, page_size: limit, include_inactive: true })
  const [updateProduct] = useUpdateProductMutation()

  const handleToggleActive = async (p: Product) => {
    try { await updateProduct({ id: p.id, is_active: !p.is_active }).unwrap() }
    catch { toast.error(locale === 'bn' ? 'আপডেট ব্যর্থ' : 'Update failed') }
  }

  const columns: Column<Product>[] = [
    {
      header: locale === 'bn' ? 'ছবি' : 'Image',
      accessor: p => p.images?.[0]?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.images[0].image} alt="" className="w-12 h-12 object-cover rounded-lg border border-gray-100" />
      ) : (
        <div className="w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-300 text-xs">
          —
        </div>
      ),
      className: 'px-4 py-2 w-20',
    },
    { header: 'SKU', accessor: 'sku', className: 'px-4 py-3 text-sm text-gray-500 font-mono' },
    {
      header: t('product.name'),
      accessor: p => (
        <span className="text-gray-800 font-medium">
          {locale === 'bn' ? p.name_bn : p.name_en}
          {p.is_package && <Badge variant="blue" className="ml-2 text-xs">{t('product.package')}</Badge>}
        </span>
      ),
    },
    {
      header: locale === 'bn' ? 'কেটাগরি' : 'Category',
      accessor: p => <span className="text-sm text-gray-600">{locale === 'bn' ? p.category_name_bn : p.category_name_en}</span>,
      exportValue: p => locale === 'bn' ? p.category_name_bn : p.category_name_en,
    },
    {
      header: locale === 'bn' ? 'ব্র্যান্ড' : 'Brand',
      accessor: p => p.brand_name_bn || p.brand_name_en
        ? <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">{locale === 'bn' ? (p.brand_name_bn ?? p.brand_name_en) : (p.brand_name_en ?? p.brand_name_bn)}</span>
        : <span className="text-gray-300 text-xs">—</span>,
      exportValue: p => locale === 'bn' ? (p.brand_name_bn ?? '') : (p.brand_name_en ?? ''),
    },
    {
      header: t('product.stock'),
      accessor: p => <Badge variant={Number(p.stock_on_hand) > 0 ? 'green' : 'red'}>{formatNumber(Math.round(Number(p.stock_on_hand)), locale)}</Badge>,
      exportValue: p => p.stock_on_hand,
    },
    {
      header: locale === 'bn' ? 'স্ট্যাটাস' : 'Status',
      accessor: p => isAdmin
        ? <ToggleSwitch checked={p.is_active} onChange={() => handleToggleActive(p)}
            activeLabel={locale === 'bn' ? 'সক্রিয়' : 'Active'} inactiveLabel={locale === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'} />
        : <Badge variant={p.is_active ? 'green' : 'red'}>{p.is_active ? (locale === 'bn' ? 'সক্রিয়' : 'Active') : (locale === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}</Badge>,
      className: 'px-4 py-3 w-36',
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('admin.products')}
        description={locale === 'bn' ? 'সকল পণ্য দেখুন, সম্পাদনা করুন ও নতুন পণ্য যোগ করুন' : 'Browse, edit and add products to your catalog'}
        {...(isAdmin && { addLabel: t('common.create'), onAdd: () => router.push(`/${locale}/admin/products/new`) })}
      />

      <div className="mb-4 grid grid-cols-5 gap-3">
        <div className="col-span-2">
          <FloatingInput label={t('common.search')} value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <FloatingSelect label={locale === 'bn' ? 'কেটাগরি' : 'Category'} value={category}
          onChange={val => { setCategory(val); setPage(1) }}>
          <option value="">{locale === 'bn' ? 'সব কেটাগরি' : 'All Categories'}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{locale === 'bn' ? c.name_bn : c.name_en}</option>)}
        </FloatingSelect>
        <FloatingSelect label={locale === 'bn' ? 'ব্র্যান্ড' : 'Brand'} value={brand}
          onChange={val => { setBrand(val); setPage(1) }}>
          <option value="">{locale === 'bn' ? 'সব ব্র্যান্ড' : 'All Brands'}</option>
          {brands.map(b => <option key={b.id} value={b.id}>{locale === 'bn' ? b.name_bn : b.name_en}</option>)}
        </FloatingSelect>
        <FloatingSelect label={locale === 'bn' ? 'ধরন' : 'Type'} value={isPackage}
          onChange={val => { setIsPackage(val); setPage(1) }}>
          <option value="">{locale === 'bn' ? 'সব ধরন' : 'All Types'}</option>
          <option value="false">{locale === 'bn' ? 'পণ্য' : 'Product'}</option>
          <option value="true">{locale === 'bn' ? 'প্যাকেজ' : 'Package'}</option>
        </FloatingSelect>
      </div>

      <ReusableTable data={data?.data ?? []} columns={columns} keyExtractor={p => p.id}
        isLoading={isLoading} totalPages={data?.pagination?.total_pages ?? 1}
        totalRecords={data?.pagination?.total} currentPage={page} onPageChange={p => setPage(p)}
        limit={limit} onLimitChange={l => { setLimit(l); setPage(1) }}
        exportFilename="products" emptyMessage={locale === 'bn' ? 'কোনো পণ্য নেই' : 'No products found'}
        quickActions={isAdmin ? [{
          label: t('common.edit'),
          render: p => (
            <Link href={`/${locale}/admin/products/${p.id}/edit`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
              title={t('common.edit')}>
              <Pencil className="w-3.5 h-3.5" />
            </Link>
          ),
        }] : []} />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ToggleSwitch from '@/components/ui/forms/ToggleSwitch'
import PageHeader from '@/components/ui/PageHeader'
import { ReusableTable, Column } from '@/components/ui/ReusableTable'
import { FloatingInput, FloatingSelect } from '@/components/ui/forms'
import { Product } from '@/lib/types'
import { toast } from '@/store/toastStore'
import { formatNumber } from '@/utils/format'
import { useGetBrandsQuery } from '@/api/brands/brandsApi'
import { useGetCategoriesQuery } from '@/api/categories/categoriesApi'
import {
  useGetProductsQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useBulkUpdateProductStatusMutation,
  useBulkDeleteProductsMutation,
} from '@/api/products/productsApi'
import { useAuthStore } from '@/store/authStore'
import { hasPermission } from '@/utils/permissions'

export default function ProductList() {
  const t      = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const isAdmin = useAuthStore(s => hasPermission(s.user, 'products', 'edit'))
  // Separate from `isAdmin` (products.edit) — bulk/per-row delete is a
  // distinct, more dangerous action, and the backend already gates it on
  // its own 'products'.'delete' permission; not every admin role should
  // get this just because they can edit products.
  const canDelete = useAuthStore(s => hasPermission(s.user, 'products', 'delete'))
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('')
  const [brand, setBrand]         = useState('')
  const [isPackage, setIsPackage] = useState('')
  const [status, setStatus]       = useState('')
  const [limit, setLimit]         = useState(20)

  const { data: categories = [] } = useGetCategoriesQuery()
  const { data: brands = [] }     = useGetBrandsQuery()
  const { data, isLoading, isFetching } = useGetProductsQuery({ page, search, category, brand, is_package: isPackage, is_active: status, page_size: limit, include_inactive: true })
  const [updateProduct] = useUpdateProductMutation()
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation()
  const [bulkUpdateStatus] = useBulkUpdateProductStatusMutation()
  const [bulkDeleteProducts] = useBulkDeleteProductsMutation()

  const handleToggleActive = async (p: Product) => {
    try { await updateProduct({ id: p.id, is_active: !p.is_active }).unwrap() }
    catch { toast.error(locale === 'bn' ? 'আপডেট ব্যর্থ' : 'Update failed') }
  }

  const handleBulkStatus = async (ids: (string | number)[], is_active: boolean) => {
    try {
      const { updated } = await bulkUpdateStatus({ ids, is_active }).unwrap()
      toast.success(
        locale === 'bn'
          ? `${updated}টি পণ্য ${is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`
          : `${updated} product(s) ${is_active ? 'activated' : 'deactivated'}`,
      )
    } catch {
      toast.error(locale === 'bn' ? 'আপডেট ব্যর্থ' : 'Update failed')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteProduct(deleteTarget.id).unwrap()
      toast.success(locale === 'bn' ? 'পণ্য মুছে ফেলা হয়েছে' : 'Product deleted')
    } catch (err) {
      const e = err as { data?: { errors?: { message_bn?: string; message_en?: string } } }
      const msg = locale === 'bn' ? e.data?.errors?.message_bn : e.data?.errors?.message_en
      toast.error(msg ?? (locale === 'bn' ? 'মুছে ফেলা ব্যর্থ' : 'Delete failed'))
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleBulkDelete = async (ids: (string | number)[]) => {
    try {
      const { deleted, skipped } = await bulkDeleteProducts(ids).unwrap()
      if (skipped.length === 0) {
        toast.success(locale === 'bn' ? `${deleted}টি পণ্য মুছে ফেলা হয়েছে` : `${deleted} product(s) deleted`)
      } else {
        const skippedList = skipped
          .map(s => `${s.name} (${locale === 'bn' ? s.reason_bn : s.reason_en})`)
          .join(', ')
        toast.error(
          locale === 'bn'
            ? `${deleted}টি মুছে ফেলা হয়েছে, ${skipped.length}টি বাদ: ${skippedList}`
            : `${deleted} deleted, ${skipped.length} skipped: ${skippedList}`,
        )
      }
    } catch {
      toast.error(locale === 'bn' ? 'মুছে ফেলা ব্যর্থ' : 'Delete failed')
    }
  }

  const columns: Column<Product>[] = [
    {
      header: locale === 'bn' ? 'ছবি' : 'Image',
      accessor: p => p.images?.[0]?.image ? (
        <Image src={p.images[0].image} alt="" width={48} height={48} quality={70} className="w-12 h-12 object-cover rounded-lg border border-border" />
      ) : (
        <div className="w-12 h-12 rounded-lg border border-border bg-background flex items-center justify-center text-muted text-xs">
          —
        </div>
      ),
      className: 'px-4 py-2 w-20',
    },
    { header: 'SKU', accessor: 'sku', className: 'px-4 py-3 text-sm text-muted font-mono' },
    {
      header: t('product.name'),
      accessor: p => (
        <span className="text-body font-medium">
          {locale === 'bn' ? p.name_bn : p.name_en}
          {p.is_package && <Badge variant="blue" className="ml-2 text-xs">{t('product.package')}</Badge>}
        </span>
      ),
    },
    {
      header: locale === 'bn' ? 'কেটাগরি' : 'Category',
      accessor: p => <span className="text-sm text-muted">{locale === 'bn' ? p.category_name_bn : p.category_name_en}</span>,
      exportValue: p => locale === 'bn' ? p.category_name_bn : p.category_name_en,
    },
    {
      header: locale === 'bn' ? 'ব্র্যান্ড' : 'Brand',
      accessor: p => p.brand_name_bn || p.brand_name_en
        ? <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 px-2 py-0.5 rounded-full">{locale === 'bn' ? (p.brand_name_bn ?? p.brand_name_en) : (p.brand_name_en ?? p.brand_name_bn)}</span>
        : <span className="text-muted text-xs">—</span>,
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

      <div className="mb-4 grid grid-cols-2 md:grid-cols-6 gap-3">
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
        <FloatingSelect label={locale === 'bn' ? 'স্ট্যাটাস' : 'Status'} value={status}
          onChange={val => { setStatus(val); setPage(1) }}>
          <option value="">{locale === 'bn' ? 'সব স্ট্যাটাস' : 'All Status'}</option>
          <option value="true">{locale === 'bn' ? 'সক্রিয়' : 'Active'}</option>
          <option value="false">{locale === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
        </FloatingSelect>
      </div>

      <ReusableTable data={data?.data ?? []} columns={columns} keyExtractor={p => p.id}
        isLoading={isLoading || isFetching} totalPages={data?.pagination?.total_pages ?? 1}
        totalRecords={data?.pagination?.total} currentPage={page} onPageChange={p => setPage(p)}
        limit={limit} onLimitChange={l => { setLimit(l); setPage(1) }}
        exportFilename="products" emptyMessage={locale === 'bn' ? 'কোনো পণ্য নেই' : 'No products found'}
        {...((isAdmin || canDelete) && {
          enableSelection: true,
          ...(isAdmin && {
            onBulkActivate: (ids: (string | number)[]) => handleBulkStatus(ids, true),
            onBulkDeactivate: (ids: (string | number)[]) => handleBulkStatus(ids, false),
          }),
          ...(canDelete && { onBulkDelete: handleBulkDelete }),
        })}
        quickActions={[
          ...(isAdmin ? [{
            label: t('common.edit'),
            render: (p: Product) => (
              <Link href={`/${locale}/admin/products/${p.id}/edit`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                title={t('common.edit')}>
                <Pencil className="w-3.5 h-3.5" />
              </Link>
            ),
          }, {
            label: locale === 'bn' ? 'কপি করুন' : 'Duplicate',
            render: (p: Product) => (
              <Link href={`/${locale}/admin/products/new?duplicateFrom=${p.id}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-muted hover:text-amber-700 hover:border-amber-400 transition-colors"
                title={locale === 'bn' ? 'কপি করুন' : 'Duplicate'}>
                <Copy className="w-3.5 h-3.5" />
              </Link>
            ),
          }] : []),
          // Only shown when the user has delete permission AND the
          // product's own can_delete annotation says it's actually safe —
          // never sold, never cash-purchased, not used inside a package.
          ...(canDelete ? [{
            label: t('common.delete'),
            show: (p: Product) => p.can_delete === true,
            render: (p: Product) => (
              <button
                type="button"
                onClick={() => setDeleteTarget(p)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                title={t('common.delete')}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ),
          }] : []),
        ]} />

      {deleteTarget && (
        <ConfirmModal
          icon="🗑️"
          title={locale === 'bn' ? 'পণ্য মুছবেন?' : 'Delete product?'}
          description={
            locale === 'bn'
              ? `"${deleteTarget.name_bn}" স্থায়ীভাবে মুছে ফেলা হবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।`
              : `"${deleteTarget.name_en}" will be permanently deleted. This cannot be undone.`
          }
          confirmLabel={locale === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
          confirmClassName="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

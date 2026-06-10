import { baseApi } from '@/api/baseApi'
import { Product, ProductImage, ApiMeta } from '@/lib/types'

interface ProductListResponse { data: Product[]; pagination: ApiMeta }

export interface CategoryWithProducts {
  category: { id: string; name_bn: string; name_en: string; icon: string; slug: string }
  products: Product[]
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getProducts: build.query<ProductListResponse, { page?: number; search?: string; page_size?: number; category?: string; brand?: string; is_package?: string; min_price?: string; max_price?: string; include_inactive?: boolean; ordering?: string; has_discount?: boolean }>({
      query: ({ page = 1, search = '', page_size, category, brand, is_package, min_price, max_price, include_inactive, ordering, has_discount } = {}) => {
        const p = new URLSearchParams({ page: String(page) })
        if (search)           p.set('search', search)
        if (page_size)        p.set('page_size', String(page_size))
        if (category)         p.set('category', category)
        if (brand)            p.set('brand', brand)
        if (is_package)       p.set('is_package', is_package)
        if (min_price)        p.set('min_price', min_price)
        if (max_price)        p.set('max_price', max_price)
        if (include_inactive) p.set('include_inactive', 'true')
        if (ordering)         p.set('ordering', ordering)
        if (has_discount)     p.set('has_discount', 'true')
        return `/api/products/?${p}`
      },
      providesTags: ['Products'],
    }),

    getProduct: build.query<Product, string>({
      query: (id) => `/api/products/${id}/`,
      transformResponse: (res: { data: Product }) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Product', id }],
    }),

    createProduct: build.mutation<Product, Partial<Product>>({
      query: (body) => ({ url: '/api/products/create/', method: 'POST', body }),
      transformResponse: (res: { data: Product }) => res.data,
      invalidatesTags: ['Products'],
    }),

    updateProduct: build.mutation<Product, { id: string } & Partial<Product>>({
      query: ({ id, ...body }) => ({ url: `/api/products/${id}/update/`, method: 'PATCH', body }),
      transformResponse: (res: { data: Product }) => res.data,
      invalidatesTags: (_r, _e, { id }) => ['Products', { type: 'Product', id }],
    }),

    deleteProduct: build.mutation<void, string>({
      query: (id) => ({ url: `/api/products/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['Products'],
    }),

    addProductImage: build.mutation<ProductImage, { productId: string; formData: FormData }>({
      query: ({ productId, formData }) => ({
        url: `/api/products/${productId}/images/`,
        method: 'POST',
        body: formData,
        formData: true,
      }),
      transformResponse: (res: { data: ProductImage }) => res.data,
      invalidatesTags: (_r, _e, { productId }) => [{ type: 'Product', id: productId }],
    }),

    deleteProductImage: build.mutation<void, { productId: string; imageId: string }>({
      query: ({ productId, imageId }) => ({
        url: `/api/products/${productId}/images/${imageId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { productId }) => [{ type: 'Product', id: productId }],
    }),

    // ── Package item endpoints ──────────────────────────────────────────────
    getPackageItems: build.query<{ data: PackageItem[] }, string>({
      query: (packageId) => `/api/products/${packageId}/package-items/`,
      providesTags: (_r, _e, id) => [{ type: 'PackageItems', id }],
    }),

    addPackageItem: build.mutation<void, { packageId: string; component_id: string; quantity: number }>({
      query: ({ packageId, ...body }) => ({
        url: `/api/products/${packageId}/package-items/add/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { packageId }) => [
        { type: 'PackageItems', id: packageId },
        { type: 'Product', id: packageId },
        'Products',
      ],
    }),

    deletePackageItem: build.mutation<void, { packageId: string; itemId: string }>({
      query: ({ packageId, itemId }) => ({
        url: `/api/products/${packageId}/package-items/${itemId}/delete/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { packageId }) => [
        { type: 'PackageItems', id: packageId },
        { type: 'Product', id: packageId },
        'Products',
      ],
    }),

    getPopularByCategory: build.query<{ data: CategoryWithProducts[] }, void>({
      query: () => '/api/products/popular-by-category/',
      providesTags: ['Products'],
    }),

  }),
  overrideExisting: false,
})

interface PackageItem {
  id: string
  component_id: string
  component_name_bn: string
  component_name_en: string
  component_sku: string
  quantity: string
}

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAddProductImageMutation,
  useDeleteProductImageMutation,
  useGetPackageItemsQuery,
  useAddPackageItemMutation,
  useDeletePackageItemMutation,
  useGetPopularByCategoryQuery,
} = productsApi

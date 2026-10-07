import { baseApi } from '@/api/baseApi'
import { Product, ProductImage, ApiMeta, VariantAttributeType, VariantAttributeValue, ProductVariant } from '@/lib/types'

interface ProductListResponse { data: Product[]; pagination: ApiMeta }

export interface CategoryWithProducts {
  category: { id: string; name_bn: string; name_en: string; icon: string; slug: string }
  products: Product[]
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getProducts: build.query<ProductListResponse, { page?: number; search?: string; page_size?: number; category?: string; brand?: string; is_package?: string; min_price?: string; max_price?: string; include_inactive?: boolean; ordering?: string; has_discount?: boolean; is_active?: string; badges?: string; payment_method?: string }>({
      query: ({ page = 1, search = '', page_size, category, brand, is_package, min_price, max_price, include_inactive, ordering, has_discount, is_active, badges, payment_method } = {}) => {
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
        if (is_active)        p.set('is_active', is_active)
        if (badges)           p.set('badges', badges)
        if (payment_method)   p.set('payment_method', payment_method)
        return `/api/products/?${p}`
      },
      providesTags: ['Products'],
      // Products don't change daily — reusing an already-fetched filter/page
      // combo for 5 minutes after the last subscriber unmounts means
      // switching filters back and forth, or navigating away and back,
      // doesn't re-hit the backend every time past RTK Query's 60s default.
      keepUnusedDataFor: 300,
    }),

    getRecommendedProducts: build.query<Product[], { limit?: number } | void>({
      query: ({ limit = 12 } = {}) => `/api/products/recommended/?limit=${limit}`,
      transformResponse: (res: { data: Product[] }) => res.data,
      providesTags: ['Products'],
    }),

    getProduct: build.query<Product, string>({
      query: (id) => `/api/products/${id}/`,
      transformResponse: (res: { data: Product }) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Product', id }],
    }),

    getProductBySlug: build.query<Product, string>({
      query: (slug) => `/api/products/slug/${slug}/`,
      transformResponse: (res: { data: Product }) => res.data,
      providesTags: (_r, _e, slug) => [{ type: 'Product', id: slug }],
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

    bulkUpdateProductStatus: build.mutation<{ updated: number }, { ids: (string | number)[]; is_active: boolean }>({
      query: (body) => ({ url: '/api/products/bulk-status/', method: 'POST', body }),
      invalidatesTags: ['Products'],
    }),

    bulkDeleteProducts: build.mutation<
      { deleted: number; skipped: { id: string; name: string; reason_bn: string; reason_en: string }[] },
      (string | number)[]
    >({
      query: (ids) => ({ url: '/api/products/bulk-delete/', method: 'POST', body: { ids } }),
      invalidatesTags: ['Products'],
    }),

    addProductImages: build.mutation<ProductImage[], { productId: string; files: File[]; visualValueIds?: (string | null)[] }>({
      query: ({ productId, files, visualValueIds }) => {
        const fd = new FormData()
        files.forEach(f => fd.append('images', f))
        // Index-aligned with `images` — one 'visual_value_ids' field per
        // file, same order, so the backend can zip them (see
        // add_product_image view).
        files.forEach((_, i) => fd.append('visual_value_ids', visualValueIds?.[i] ?? ''))
        return { url: `/api/products/${productId}/images/`, method: 'POST', body: fd, formData: true }
      },
      transformResponse: (res: { data: ProductImage[] }) => res.data,
      invalidatesTags: (_r, _e, { productId }) => [{ type: 'Product', id: productId }],
    }),

    deleteProductImage: build.mutation<void, { productId: string; imageId: string }>({
      query: ({ productId, imageId }) => ({
        url: `/api/products/${productId}/images/${imageId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { productId }) => [{ type: 'Product', id: productId }],
    }),

    updateProductImage: build.mutation<ProductImage, { productId: string; imageId: string; visual_value_id: string | null }>({
      query: ({ productId, imageId, visual_value_id }) => ({
        url: `/api/products/${productId}/images/${imageId}/`,
        method: 'PATCH',
        body: { visual_value_id },
      }),
      transformResponse: (res: { data: ProductImage }) => res.data,
      invalidatesTags: (_r, _e, { productId }) => [{ type: 'Product', id: productId }],
    }),

    // ── Variant / attribute library endpoints ──────────────────────────────
    getAttributeTypes: build.query<VariantAttributeType[], { includeInactive?: boolean } | void>({
      query: (params) => {
        const p = new URLSearchParams()
        if (params?.includeInactive) p.set('include_inactive', 'true')
        return `/api/attribute-types/?${p}`
      },
      transformResponse: (res: { data: VariantAttributeType[] }) => res.data,
      providesTags: ['AttributeTypes'],
    }),

    createAttributeType: build.mutation<VariantAttributeType, { name_bn: string; name_en: string; code: string; has_bilingual_values: boolean }>({
      query: (body) => ({ url: '/api/attribute-types/create/', method: 'POST', body }),
      transformResponse: (res: { data: VariantAttributeType }) => res.data,
      invalidatesTags: ['AttributeTypes'],
    }),

    updateAttributeType: build.mutation<VariantAttributeType, { id: string; name_bn?: string; name_en?: string; has_bilingual_values?: boolean; is_active?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/api/attribute-types/${id}/`, method: 'PATCH', body }),
      transformResponse: (res: { data: VariantAttributeType }) => res.data,
      invalidatesTags: ['AttributeTypes'],
    }),

    deleteAttributeType: build.mutation<void, string>({
      query: (id) => ({ url: `/api/attribute-types/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['AttributeTypes'],
    }),

    getAttributeValues: build.query<VariantAttributeValue[], { attribute_type_id?: string; includeInactive?: boolean } | void>({
      query: (params) => {
        const p = new URLSearchParams()
        if (params?.attribute_type_id) p.set('attribute_type_id', params.attribute_type_id)
        if (params?.includeInactive) p.set('include_inactive', 'true')
        return `/api/attribute-values/?${p}`
      },
      transformResponse: (res: { data: VariantAttributeValue[] }) => res.data,
      providesTags: ['AttributeValues'],
    }),

    createAttributeValue: build.mutation<VariantAttributeValue, { attribute_type_id: string; value_bn?: string; value_en: string }>({
      query: (body) => ({ url: '/api/attribute-values/create/', method: 'POST', body }),
      transformResponse: (res: { data: VariantAttributeValue }) => res.data,
      invalidatesTags: ['AttributeValues'],
    }),

    updateAttributeValue: build.mutation<VariantAttributeValue, { id: string; value_bn?: string; value_en?: string; is_active?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/api/attribute-values/${id}/`, method: 'PATCH', body }),
      transformResponse: (res: { data: VariantAttributeValue }) => res.data,
      invalidatesTags: ['AttributeValues'],
    }),

    deleteAttributeValue: build.mutation<void, string>({
      query: (id) => ({ url: `/api/attribute-values/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['AttributeValues'],
    }),

    generateProductVariants: build.mutation<ProductVariant[], { productId: string; value_ids: string[] }>({
      query: ({ productId, value_ids }) => ({ url: `/api/products/${productId}/variants/generate/`, method: 'POST', body: { value_ids } }),
      transformResponse: (res: { data: ProductVariant[] }) => res.data,
      invalidatesTags: (_r, _e, { productId }) => [{ type: 'Product', id: productId }, 'Products'],
    }),

    updateProductVariant: build.mutation<ProductVariant, { productId: string; variantId: string; sku_suffix?: string; price_override?: string | null; is_active?: boolean }>({
      query: ({ productId, variantId, ...body }) => ({ url: `/api/products/${productId}/variants/${variantId}/`, method: 'PATCH', body }),
      transformResponse: (res: { data: ProductVariant }) => res.data,
      invalidatesTags: (_r, _e, { productId }) => [{ type: 'Product', id: productId }, 'Products'],
    }),

    deleteProductVariant: build.mutation<void, { productId: string; variantId: string }>({
      query: ({ productId, variantId }) => ({ url: `/api/products/${productId}/variants/${variantId}/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { productId }) => [{ type: 'Product', id: productId }, 'Products'],
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
  useLazyGetProductsQuery,
  useGetProductQuery,
  useGetProductBySlugQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useBulkUpdateProductStatusMutation,
  useBulkDeleteProductsMutation,
  useAddProductImagesMutation,
  useDeleteProductImageMutation,
  useUpdateProductImageMutation,
  useGetPackageItemsQuery,
  useAddPackageItemMutation,
  useDeletePackageItemMutation,
  useGetPopularByCategoryQuery,
  useGetRecommendedProductsQuery,
  useGetAttributeTypesQuery,
  useCreateAttributeTypeMutation,
  useUpdateAttributeTypeMutation,
  useDeleteAttributeTypeMutation,
  useGetAttributeValuesQuery,
  useCreateAttributeValueMutation,
  useUpdateAttributeValueMutation,
  useDeleteAttributeValueMutation,
  useGenerateProductVariantsMutation,
  useUpdateProductVariantMutation,
  useDeleteProductVariantMutation,
} = productsApi

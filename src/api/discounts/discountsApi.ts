import { baseApi } from '@/api/baseApi'
import { ApiMeta } from '@/lib/types'

export interface Discount {
  id: string
  product: string
  product_name_bn: string
  product_name_en: string
  product_sku: string
  product_image: string | null
  discount_type: 'PERCENTAGE' | 'FLAT'
  discount_value: string
  note: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
  created_at: string
}

export const discountsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getDiscounts: build.query<{ data: Discount[]; pagination: ApiMeta }, { product?: string; page?: number; page_size?: number }>({
      query: ({ product, page = 1, page_size } = {}) => {
        const p = new URLSearchParams({ page: String(page) })
        if (product)   p.set('product', product)
        if (page_size) p.set('page_size', String(page_size))
        return `/api/discounts/?${p}`
      },
      transformResponse: (res: { data: Discount[]; pagination: ApiMeta }) => ({ data: res.data, pagination: res.pagination }),
      providesTags: ['Discounts'],
    }),

    createDiscount: build.mutation<Discount, { product: string; discount_type: string; discount_value: string; note?: string; start_date?: string | null; end_date?: string | null }>({
      query: (body) => ({ url: '/api/discounts/create/', method: 'POST', body }),
      transformResponse: (res: { data: Discount }) => res.data,
      invalidatesTags: ['Discounts', 'Products'],
    }),

    updateDiscount: build.mutation<Discount, { id: string; discount_type?: string; discount_value?: string; note?: string; start_date?: string | null; end_date?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/api/discounts/${id}/update/`, method: 'PATCH', body }),
      transformResponse: (res: { data: Discount }) => res.data,
      invalidatesTags: ['Discounts', 'Products'],
    }),

    toggleDiscount: build.mutation<Discount, string>({
      query: (id) => ({ url: `/api/discounts/${id}/toggle/`, method: 'PATCH' }),
      transformResponse: (res: { data: Discount }) => res.data,
      invalidatesTags: ['Discounts', 'Products'],
    }),

    deleteDiscount: build.mutation<void, string>({
      query: (id) => ({ url: `/api/discounts/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['Discounts', 'Products'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetDiscountsQuery,
  useCreateDiscountMutation,
  useUpdateDiscountMutation,
  useToggleDiscountMutation,
  useDeleteDiscountMutation,
} = discountsApi

import { baseApi } from '@/api/baseApi'

export interface Discount {
  id: string
  product: string
  product_name_bn: string
  product_name_en: string
  product_sku: string
  discount_type: 'PERCENTAGE' | 'FLAT'
  discount_value: string
  note: string
  is_active: boolean
  created_at: string
}

export const discountsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getDiscounts: build.query<Discount[], { product?: string }>({
      query: ({ product } = {}) => {
        const p = new URLSearchParams()
        if (product) p.set('product', product)
        return `/api/discounts/?${p}`
      },
      transformResponse: (res: { data: Discount[] }) => res.data,
      providesTags: ['Discounts'],
    }),

    createDiscount: build.mutation<Discount, { product: string; discount_type: string; discount_value: string; note?: string }>({
      query: (body) => ({ url: '/api/discounts/create/', method: 'POST', body }),
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
  useToggleDiscountMutation,
  useDeleteDiscountMutation,
} = discountsApi

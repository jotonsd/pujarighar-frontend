import { baseApi } from '@/api/baseApi'

export type PromoDiscountType = 'PERCENT' | 'FLAT'
export type PromoScope = 'MOBILE_APP' | 'WEBSITE'

export interface PromoCode {
  id: number
  code: string
  scope: PromoScope
  discount_type: PromoDiscountType
  discount_value: string
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  is_valid_now: boolean
  times_used: number
}

export const promoCodesApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getPromoCodes: build.query<PromoCode[], void>({
      query: () => '/api/promo-codes/',
      transformResponse: (res: { data: PromoCode[] }) => res.data,
      providesTags: ['PromoCodes'],
    }),
    createPromoCode: build.mutation<PromoCode, {
      code: string
      scope: PromoScope
      discount_type: PromoDiscountType
      discount_value: string
      valid_from?: string | null
      valid_until?: string | null
    }>({
      query: body => ({ url: '/api/promo-codes/create/', method: 'POST', body }),
      transformResponse: (res: { data: PromoCode }) => res.data,
      invalidatesTags: ['PromoCodes'],
    }),
    updatePromoCode: build.mutation<PromoCode, {
      id: number
      is_active?: boolean
      scope?: PromoScope
      discount_type?: PromoDiscountType
      discount_value?: string
      valid_from?: string | null
      valid_until?: string | null
    }>({
      query: ({ id, ...body }) => ({ url: `/api/promo-codes/${id}/update/`, method: 'PATCH', body }),
      transformResponse: (res: { data: PromoCode }) => res.data,
      invalidatesTags: ['PromoCodes'],
    }),
  }),
})

export const {
  useGetPromoCodesQuery,
  useCreatePromoCodeMutation,
  useUpdatePromoCodeMutation,
} = promoCodesApi

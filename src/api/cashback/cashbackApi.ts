import { baseApi } from '@/api/baseApi'

export interface CashbackTier {
  id: number
  min_order_amount: string
  cashback_type: 'FIXED' | 'PERCENTAGE'
  cashback_value: string
  max_cashback: string
  is_active: boolean
}

export interface CreateCashbackTierBody {
  min_order_amount: string | number
  cashback_type: 'FIXED' | 'PERCENTAGE'
  cashback_value: string | number
  max_cashback?: string | number
  is_active?: boolean
}

export const cashbackApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCashbackTiers: build.query<CashbackTier[], void>({
      query: () => '/api/cashback/',
      transformResponse: (res: { data: CashbackTier[] }) => res.data,
      providesTags: ['Cashback'],
    }),
    createCashbackTier: build.mutation<CashbackTier, CreateCashbackTierBody>({
      query: (body) => ({ url: '/api/cashback/create/', method: 'POST', body }),
      transformResponse: (res: { data: CashbackTier }) => res.data,
      invalidatesTags: ['Cashback'],
    }),
    updateCashbackTier: build.mutation<CashbackTier, { id: number } & Partial<CreateCashbackTierBody>>({
      query: ({ id, ...body }) => ({ url: `/api/cashback/${id}/update/`, method: 'PATCH', body }),
      transformResponse: (res: { data: CashbackTier }) => res.data,
      invalidatesTags: ['Cashback'],
    }),
    deleteCashbackTier: build.mutation<void, number>({
      query: (id) => ({ url: `/api/cashback/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['Cashback'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useListCashbackTiersQuery,
  useCreateCashbackTierMutation,
  useUpdateCashbackTierMutation,
  useDeleteCashbackTierMutation,
} = cashbackApi

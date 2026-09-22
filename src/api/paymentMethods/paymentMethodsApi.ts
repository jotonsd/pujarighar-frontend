import { baseApi } from '@/api/baseApi'

export type ChargeType = 'NONE' | 'PERCENT' | 'FLAT'

export interface PaymentMethod {
  id: number
  code: string
  name_bn: string
  name_en: string
  is_enabled: boolean
  is_integrated: boolean
  charge_type: ChargeType
  charge_value: string
  sort_order: number
}

export const paymentMethodsApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getPaymentMethods: build.query<PaymentMethod[], void>({
      query: () => '/api/payment-methods/',
      transformResponse: (res: { data: PaymentMethod[] }) => res.data,
      providesTags: ['PaymentMethods'],
    }),
    updatePaymentMethod: build.mutation<PaymentMethod, { id: number; is_enabled?: boolean; charge_type?: ChargeType; charge_value?: string }>({
      query: ({ id, ...body }) => ({ url: `/api/payment-methods/${id}/update/`, method: 'PATCH', body }),
      transformResponse: (res: { data: PaymentMethod }) => res.data,
      invalidatesTags: ['PaymentMethods'],
    }),
  }),
})

export const { useGetPaymentMethodsQuery, useUpdatePaymentMethodMutation } = paymentMethodsApi

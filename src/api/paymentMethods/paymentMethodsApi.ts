import { baseApi } from '@/api/baseApi'

export type ChargeType = 'NONE' | 'PERCENT' | 'FLAT'

export interface PaymentMethod {
  id: number
  code: string
  name_bn: string
  name_en: string
  logo: string | null
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
    createPaymentMethod: build.mutation<PaymentMethod, FormData>({
      query: body => ({ url: '/api/payment-methods/create/', method: 'POST', body }),
      transformResponse: (res: { data: PaymentMethod }) => res.data,
      invalidatesTags: ['PaymentMethods'],
    }),
    updatePaymentMethod: build.mutation<PaymentMethod, { id: number; is_enabled?: boolean; charge_type?: ChargeType; charge_value?: string; name_bn?: string; name_en?: string }>({
      query: ({ id, ...body }) => ({ url: `/api/payment-methods/${id}/update/`, method: 'PATCH', body }),
      transformResponse: (res: { data: PaymentMethod }) => res.data,
      invalidatesTags: ['PaymentMethods'],
    }),
    uploadPaymentMethodLogo: build.mutation<PaymentMethod, { id: number; file: File }>({
      query: ({ id, file }) => {
        const fd = new FormData()
        fd.append('logo', file)
        return { url: `/api/payment-methods/${id}/update/`, method: 'PATCH', body: fd }
      },
      transformResponse: (res: { data: PaymentMethod }) => res.data,
      invalidatesTags: ['PaymentMethods'],
    }),
  }),
})

export const {
  useGetPaymentMethodsQuery,
  useCreatePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
  useUploadPaymentMethodLogoMutation,
} = paymentMethodsApi

import { baseApi } from '@/api/baseApi'

export interface DeliveryCharges {
  inside_dhaka:  string
  outside_dhaka: string
  updated_at:    string | null
}

export const deliveryChargesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getDeliveryCharges: build.query<DeliveryCharges, void>({
      query: () => '/api/delivery-charges/',
      transformResponse: (res: { data: DeliveryCharges }) => res.data,
      providesTags: ['DeliveryCharges'],
    }),

    updateDeliveryCharges: build.mutation<DeliveryCharges, { inside_dhaka?: string; outside_dhaka?: string }>({
      query: (body) => ({ url: '/api/delivery-charges/update/', method: 'PATCH', body }),
      transformResponse: (res: { data: DeliveryCharges }) => res.data,
      invalidatesTags: ['DeliveryCharges'],
    }),

  }),
  overrideExisting: false,
})

export const { useGetDeliveryChargesQuery, useUpdateDeliveryChargesMutation } = deliveryChargesApi

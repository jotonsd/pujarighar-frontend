import { baseApi } from '@/api/baseApi'

export interface DeliveryWeightTier {
  max_weight_kg: string
  charge_amount: string
}

export interface DeliveryCharges {
  inside_dhaka:  string
  outside_dhaka: string
  inside_dhaka_weight_tiers:  DeliveryWeightTier[]
  outside_dhaka_weight_tiers: DeliveryWeightTier[]
  inside_dhaka_extra_per_kg:  string
  outside_dhaka_extra_per_kg: string
  // Only present when the query was called with a `weight` — the actual
  // charge_for() result for that weight, so the cart/checkout preview
  // matches what checkout will really charge instead of the flat rate above.
  inside_dhaka_for_weight?:  string
  outside_dhaka_for_weight?: string
  updated_at:    string | null
}

export const deliveryChargesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getDeliveryCharges: build.query<DeliveryCharges, { weight?: string } | void>({
      query: (args) => {
        const weight = args?.weight
        return weight ? `/api/delivery-charges/?weight=${encodeURIComponent(weight)}` : '/api/delivery-charges/'
      },
      transformResponse: (res: { data: DeliveryCharges }) => res.data,
      providesTags: ['DeliveryCharges'],
    }),

    updateDeliveryCharges: build.mutation<DeliveryCharges, {
      inside_dhaka?: string
      outside_dhaka?: string
      inside_dhaka_weight_tiers?: DeliveryWeightTier[]
      outside_dhaka_weight_tiers?: DeliveryWeightTier[]
      inside_dhaka_extra_per_kg?: string
      outside_dhaka_extra_per_kg?: string
    }>({
      query: (body) => ({ url: '/api/delivery-charges/update/', method: 'PATCH', body }),
      transformResponse: (res: { data: DeliveryCharges }) => res.data,
      invalidatesTags: ['DeliveryCharges'],
    }),

  }),
  overrideExisting: false,
})

export const { useGetDeliveryChargesQuery, useUpdateDeliveryChargesMutation } = deliveryChargesApi

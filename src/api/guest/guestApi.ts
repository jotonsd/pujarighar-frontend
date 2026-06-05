import { baseApi } from '@/api/baseApi'

interface GuestCheckoutPayload {
  items: { product_id: string; quantity: string }[]
  name_bn: string
  phone: string
  address_bn: string
  district?: string
  thana?: string
  post_code?: string
  notes_bn?: string
  email?: string
  payment_method: 'COD' | 'ONLINE'
  delivery_zone?: 'inside' | 'outside'
  apply_delivery?: boolean
}

interface GuestOrderResult {
  order_number: string
  order_id: string
  grand_total: string
  status: string
  gateway_url?: string
}

export const guestApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    guestCheckout: build.mutation<GuestOrderResult, GuestCheckoutPayload>({
      query: (body) => ({ url: '/api/cart/guest-checkout/', method: 'POST', body }),
      transformResponse: (res: { data: GuestOrderResult }) => res.data,
    }),

  }),
  overrideExisting: false,
})

export const { useGuestCheckoutMutation } = guestApi

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
  payment_method: 'COD' | 'SSLCOMMERZ' | 'BKASH' | 'NAGAD' | 'STRIPE'
  delivery_zone?: 'inside' | 'outside'
  apply_delivery?: boolean
}

interface GuestOrderResult {
  // order_number/order_id/status are absent for an online payment_method —
  // no order exists yet at this point (see cart_views.checkout's identical
  // deferral; guest_views.guest_checkout mirrors it) — only gateway_url/
  // grand_total come back until SSLCommerzService.confirm_payment actually
  // creates the order.
  order_number?: string
  order_id?: string
  grand_total: string
  gateway_charge_amount?: string
  status?: string
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

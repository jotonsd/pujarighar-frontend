import { baseApi } from '@/api/baseApi'
import { Cart, SalesOrder } from '@/lib/types'

export const cartApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getCart: build.query<Cart, void>({
      query: () => '/api/cart/',
      transformResponse: (res: { data: Cart }) => res.data,
      providesTags: ['Cart'],
    }),

    addToCart: build.mutation<Cart, { product_id: string; quantity: string }>({
      query: (body) => ({ url: '/api/cart/items/', method: 'POST', body }),
      transformResponse: (res: { data: Cart }) => res.data,
      invalidatesTags: ['Cart'],
    }),

    updateCartItem: build.mutation<Cart, { itemId: string; quantity: string }>({
      query: ({ itemId, quantity }) => ({
        url: `/api/cart/items/${itemId}/`,
        method: 'PATCH',
        body: { quantity },
      }),
      transformResponse: (res: { data: Cart }) => res.data,
      invalidatesTags: ['Cart'],
    }),

    removeCartItem: build.mutation<void, string>({
      query: (itemId) => ({ url: `/api/cart/items/${itemId}/`, method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),

    clearCart: build.mutation<void, void>({
      query: () => ({ url: '/api/cart/clear/', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),

    checkout: build.mutation<SalesOrder & { gateway_url?: string }, { payment_method: 'COD' | 'ONLINE'; shipping_address_id?: string }>({
      query: (body) => ({ url: '/api/cart/checkout/', method: 'POST', body }),
      transformResponse: (res: { data: SalesOrder & { gateway_url?: string } }) => res.data,
      invalidatesTags: ['Cart', 'Orders'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useCheckoutMutation,
} = cartApi

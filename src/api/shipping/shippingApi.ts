import { baseApi } from '@/api/baseApi'
import { ShippingAddress } from '@/lib/types'

type AddressPayload = {
  label?: string
  full_name_bn: string
  full_name_en?: string
  phone: string
  address_bn: string
  address_en?: string
  district?: string
  thana?: string
  post_code?: string
  is_default?: boolean
}

export const shippingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    listShippingAddresses: build.query<ShippingAddress[], void>({
      query: () => '/api/shipping-addresses/',
      transformResponse: (res: { data: ShippingAddress[] }) => res.data,
      providesTags: ['ShippingAddresses'],
    }),

    createShippingAddress: build.mutation<ShippingAddress, AddressPayload>({
      query: (body) => ({ url: '/api/shipping-addresses/create/', method: 'POST', body }),
      transformResponse: (res: { data: ShippingAddress }) => res.data,
      invalidatesTags: ['ShippingAddresses'],
    }),

    updateShippingAddress: build.mutation<ShippingAddress, { id: string } & Partial<AddressPayload>>({
      query: ({ id, ...body }) => ({ url: `/api/shipping-addresses/${id}/update/`, method: 'PATCH', body }),
      transformResponse: (res: { data: ShippingAddress }) => res.data,
      invalidatesTags: ['ShippingAddresses'],
    }),

    deleteShippingAddress: build.mutation<void, string>({
      query: (id) => ({ url: `/api/shipping-addresses/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['ShippingAddresses'],
    }),

    setDefaultShippingAddress: build.mutation<ShippingAddress, string>({
      query: (id) => ({ url: `/api/shipping-addresses/${id}/set-default/`, method: 'POST' }),
      transformResponse: (res: { data: ShippingAddress }) => res.data,
      invalidatesTags: ['ShippingAddresses'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useListShippingAddressesQuery,
  useCreateShippingAddressMutation,
  useUpdateShippingAddressMutation,
  useDeleteShippingAddressMutation,
  useSetDefaultShippingAddressMutation,
} = shippingApi

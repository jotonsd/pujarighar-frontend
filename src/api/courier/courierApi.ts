import { baseApi } from '@/api/baseApi'
import { CourierConsignment, CourierProvider, CourierReturnRequest } from '@/lib/types'

interface ApiMetaLike { page: number; page_size: number; total: number; total_pages: number }
interface ConsignmentListResponse { data: CourierConsignment[]; pagination: ApiMetaLike }
interface ReturnRequestListResponse { data: CourierReturnRequest[]; pagination: ApiMetaLike }

export const courierApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getCourierProviders: build.query<CourierProvider[], void>({
      query: () => '/api/courier/providers/',
      transformResponse: (res: { data: CourierProvider[] }) => res.data,
      providesTags: ['CourierProviders'],
    }),

    createCourierProvider: build.mutation<CourierProvider, Partial<CourierProvider> & { api_key?: string; secret_key?: string }>({
      query: body => ({ url: '/api/courier/providers/', method: 'POST', body }),
      transformResponse: (res: { data: CourierProvider }) => res.data,
      invalidatesTags: ['CourierProviders'],
    }),

    updateCourierProvider: build.mutation<CourierProvider, { id: number } & Partial<CourierProvider> & { api_key?: string; secret_key?: string }>({
      query: ({ id, ...body }) => ({ url: `/api/courier/providers/${id}/update/`, method: 'PATCH', body }),
      transformResponse: (res: { data: CourierProvider }) => res.data,
      invalidatesTags: ['CourierProviders'],
    }),

    getCourierProviderBalance: build.query<{ current_balance: number }, number>({
      query: providerId => `/api/courier/providers/${providerId}/balance/`,
      transformResponse: (res: { data: { current_balance: number } }) => res.data,
    }),

    getCourierConsignments: build.query<ConsignmentListResponse, { page?: number; status?: string } | void>({
      query: ({ page = 1, status = '' } = {}) => {
        const p = new URLSearchParams({ page: String(page) })
        if (status) p.set('status', status)
        return `/api/courier/consignments/?${p}`
      },
      providesTags: ['CourierConsignments'],
    }),

    getCourierConsignment: build.query<CourierConsignment, string>({
      query: id => `/api/courier/consignments/${id}/`,
      transformResponse: (res: { data: CourierConsignment }) => res.data,
      providesTags: ['CourierConsignments'],
    }),

    sendOrderToCourier: build.mutation<CourierConsignment, { orderId: string; provider_id: number }>({
      query: ({ orderId, provider_id }) => ({
        url: `/api/orders/${orderId}/courier/send/`,
        method: 'POST',
        body: { provider_id },
      }),
      transformResponse: (res: { data: CourierConsignment }) => res.data,
      invalidatesTags: ['CourierConsignments', 'Order', 'Orders'],
    }),

    refreshCourierStatus: build.mutation<CourierConsignment, string>({
      query: orderId => ({ url: `/api/orders/${orderId}/courier/status/`, method: 'GET' }),
      transformResponse: (res: { data: CourierConsignment }) => res.data,
      invalidatesTags: ['CourierConsignments', 'Order', 'Orders'],
    }),

    getCourierReturnRequests: build.query<ReturnRequestListResponse, { page?: number } | void>({
      query: ({ page = 1 } = {}) => `/api/courier/return-requests/?page=${page}`,
      providesTags: ['CourierReturnRequests'],
    }),

    createCourierReturnRequest: build.mutation<CourierReturnRequest, { consignment_id: string; reason: string }>({
      query: body => ({ url: '/api/courier/return-requests/create/', method: 'POST', body }),
      transformResponse: (res: { data: CourierReturnRequest }) => res.data,
      invalidatesTags: ['CourierReturnRequests'],
    }),

    getCourierPayments: build.query<unknown, number>({
      query: providerId => `/api/courier/payments/?provider_id=${providerId}`,
      transformResponse: (res: { data: unknown }) => res.data,
    }),
  }),
})

export const {
  useGetCourierProvidersQuery,
  useCreateCourierProviderMutation,
  useUpdateCourierProviderMutation,
  useGetCourierProviderBalanceQuery,
  useGetCourierConsignmentsQuery,
  useGetCourierConsignmentQuery,
  useSendOrderToCourierMutation,
  useRefreshCourierStatusMutation,
  useGetCourierReturnRequestsQuery,
  useCreateCourierReturnRequestMutation,
  useGetCourierPaymentsQuery,
} = courierApi

import { baseApi } from '@/api/baseApi'
import { SalesOrder, StatusLogEntry, ApiMeta, OrderTracking } from '@/lib/types'

interface OrderListResponse { data: SalesOrder[]; pagination: ApiMeta }

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getOrders: build.query<OrderListResponse, { page?: number; status?: string }>({
      query: ({ page = 1, status = '' } = {}) => {
        const p = new URLSearchParams({ page: String(page) })
        if (status) p.set('status', status)
        return `/api/orders/?${p}`
      },
      providesTags: ['Orders'],
    }),

    getOrder: build.query<SalesOrder, string>({
      query: (id) => `/api/orders/${id}/`,
      transformResponse: (res: { data: SalesOrder }) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),

    getOrderTracking: build.query<OrderTracking, string>({
      query: (id) => `/api/orders/${id}/tracking/`,
      transformResponse: (res: { data: OrderTracking }) => res.data,
    }),

    getOrderStatusLog: build.query<StatusLogEntry[], string>({
      query: (id) => `/api/orders/${id}/status-log/`,
      transformResponse: (res: { data: StatusLogEntry[] }) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'OrderLogs', id }],
    }),

    confirmOrder: build.mutation<SalesOrder, string>({
      query: (id) => ({ url: `/api/orders/${id}/confirm/`, method: 'POST', body: {} }),
      transformResponse: (res: { data: SalesOrder }) => res.data,
      invalidatesTags: (_r, _e, id) => ['Orders', { type: 'Order', id }, { type: 'OrderLogs', id }],
    }),

    packOrder: build.mutation<SalesOrder, string>({
      query: (id) => ({ url: `/api/orders/${id}/pack/`, method: 'POST', body: {} }),
      transformResponse: (res: { data: SalesOrder }) => res.data,
      invalidatesTags: (_r, _e, id) => ['Orders', { type: 'Order', id }, { type: 'OrderLogs', id }],
    }),

    assignDelivery: build.mutation<SalesOrder, { id: string; delivery_person_id: string }>({
      query: ({ id, delivery_person_id }) => ({
        url: `/api/orders/${id}/assign-delivery/`,
        method: 'POST',
        body: { delivery_person_id },
      }),
      transformResponse: (res: { data: SalesOrder }) => res.data,
      invalidatesTags: (_r, _e, { id }) => ['Orders', { type: 'Order', id }, { type: 'OrderLogs', id }],
    }),

    dispatchOrder: build.mutation<SalesOrder, string>({
      query: (id) => ({ url: `/api/orders/${id}/dispatch/`, method: 'POST', body: {} }),
      transformResponse: (res: { data: SalesOrder }) => res.data,
      invalidatesTags: (_r, _e, id) => ['Orders', { type: 'Order', id }, { type: 'OrderLogs', id }],
    }),

    deliverOrder: build.mutation<SalesOrder, string>({
      query: (id) => ({ url: `/api/orders/${id}/deliver/`, method: 'POST', body: {} }),
      transformResponse: (res: { data: SalesOrder }) => res.data,
      invalidatesTags: (_r, _e, id) => ['Orders', { type: 'Order', id }, { type: 'OrderLogs', id }],
    }),

    returnOrder: build.mutation<SalesOrder, { id: string; note_bn?: string; note_en?: string }>({
      query: ({ id, ...body }) => ({ url: `/api/orders/${id}/return/`, method: 'POST', body }),
      transformResponse: (res: { data: SalesOrder }) => res.data,
      invalidatesTags: (_r, _e, { id }) => ['Orders', { type: 'Order', id }, { type: 'OrderLogs', id }],
    }),

    cancelOrder: build.mutation<SalesOrder, { id: string; note_bn?: string; note_en?: string }>({
      query: ({ id, ...body }) => ({ url: `/api/orders/${id}/cancel/`, method: 'POST', body }),
      transformResponse: (res: { data: SalesOrder }) => res.data,
      invalidatesTags: (_r, _e, { id }) => ['Orders', { type: 'Order', id }, { type: 'OrderLogs', id }],
    }),

    trackByOrderNumber: build.query<OrderTracking, { order_number: string; phone: string }>({
      query: ({ order_number, phone }) =>
        `/api/orders/track/?order_number=${encodeURIComponent(order_number)}&phone=${encodeURIComponent(phone)}`,
      transformResponse: (res: { data: OrderTracking }) => res.data,
    }),

    posCreateOrder: build.mutation<SalesOrder, {
      items: { product_id: string; quantity: string }[]
      name_bn: string; phone: string; address_bn: string
      district?: string; thana?: string; post_code?: string
      notes_bn?: string; email?: string
    }>({
      query: (body) => ({ url: '/api/orders/pos-create/', method: 'POST', body }),
      transformResponse: (res: { data: SalesOrder }) => res.data,
      invalidatesTags: ['Orders'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useGetOrderTrackingQuery,
  useGetOrderStatusLogQuery,
  useConfirmOrderMutation,
  usePackOrderMutation,
  useAssignDeliveryMutation,
  useDispatchOrderMutation,
  useDeliverOrderMutation,
  useReturnOrderMutation,
  useCancelOrderMutation,
  usePosCreateOrderMutation,
  useTrackByOrderNumberQuery,
} = ordersApi

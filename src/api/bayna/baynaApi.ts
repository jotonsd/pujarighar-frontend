import { baseApi } from '@/api/baseApi'
import { ApiMeta, BaynaBooking } from '@/lib/types'

interface BookingListResponse { data: BaynaBooking[]; pagination: ApiMeta }

export interface CreateBaynaBookingPayload {
  service_type: string
  event_date: string
  name: string
  phone: string
  email?: string
  location?: string
  description: string
}

export const baynaApi = baseApi.injectEndpoints({
  endpoints: build => ({

    createBaynaBooking: build.mutation<BaynaBooking, CreateBaynaBookingPayload>({
      query: body => ({ url: '/api/bayna/create/', method: 'POST', body }),
      transformResponse: (res: { data: BaynaBooking }) => res.data,
      invalidatesTags: ['Bayna'],
    }),

    getBaynaBookings: build.query<BookingListResponse, { page?: number; status?: string; service_type?: string } | void>({
      query: (args) => {
        const p = new URLSearchParams()
        if (args?.page) p.set('page', String(args.page))
        if (args?.status) p.set('status', args.status)
        if (args?.service_type) p.set('service_type', args.service_type)
        return `/api/bayna/?${p}`
      },
      providesTags: ['Bayna'],
    }),

    getBaynaBooking: build.query<BaynaBooking, string>({
      query: id => `/api/bayna/${id}/`,
      transformResponse: (res: { data: BaynaBooking }) => res.data,
      providesTags: ['Bayna'],
    }),

    updateBaynaBooking: build.mutation<BaynaBooking, { id: string; status?: string; admin_notes?: string; event_date?: string }>({
      query: ({ id, ...body }) => ({ url: `/api/bayna/${id}/update/`, method: 'PATCH', body }),
      transformResponse: (res: { data: BaynaBooking }) => res.data,
      invalidatesTags: ['Bayna'],
    }),

    getMyBaynaBookings: build.query<BaynaBooking[], void>({
      query: () => '/api/bayna/mine/',
      transformResponse: (res: { data: BaynaBooking[] }) => res.data,
      providesTags: ['Bayna'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useCreateBaynaBookingMutation,
  useGetBaynaBookingsQuery,
  useGetBaynaBookingQuery,
  useUpdateBaynaBookingMutation,
  useGetMyBaynaBookingsQuery,
} = baynaApi

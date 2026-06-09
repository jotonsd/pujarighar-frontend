import { baseApi } from '@/api/baseApi'
import { Partner, PartnerProfitPayment, PartnerPaymentsData } from '@/lib/types'

export const partnersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getPartners: build.query<Partner[], void>({
      query: () => '/api/partners/',
      transformResponse: (res: { data: Partner[] }) => res.data,
      providesTags: ['Partners'],
    }),

    createPartner: build.mutation<Partner, Partial<Partner>>({
      query: (body) => ({ url: '/api/partners/create/', method: 'POST', body }),
      invalidatesTags: ['Partners'],
    }),

    updatePartner: build.mutation<Partner, { id: string } & Partial<Partner>>({
      query: ({ id, ...body }) => ({ url: `/api/partners/${id}/update/`, method: 'PATCH', body }),
      invalidatesTags: ['Partners'],
    }),

    deletePartner: build.mutation<void, string>({
      query: (id) => ({ url: `/api/partners/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['Partners'],
    }),

    getPartnerPayments: build.query<PartnerPaymentsData, string>({
      query: (partnerId) => `/api/partners/${partnerId}/payments/`,
      transformResponse: (res: { data: PartnerPaymentsData }) => res.data,
      providesTags: (_r, _e, partnerId) => [{ type: 'Partners', id: `payments-${partnerId}` }],
    }),

    createPartnerPayment: build.mutation<PartnerProfitPayment, { partnerId: string } & Partial<PartnerProfitPayment>>({
      query: ({ partnerId, ...body }) => ({ url: `/api/partners/${partnerId}/payments/create/`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { partnerId }) => [{ type: 'Partners', id: `payments-${partnerId}` }],
    }),

    updatePartnerPayment: build.mutation<PartnerProfitPayment, { partnerId: string; id: string } & Partial<PartnerProfitPayment>>({
      query: ({ partnerId, id, ...body }) => ({ url: `/api/partners/${partnerId}/payments/${id}/update/`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { partnerId }) => [{ type: 'Partners', id: `payments-${partnerId}` }],
    }),

    deletePartnerPayment: build.mutation<void, { partnerId: string; id: string }>({
      query: ({ partnerId, id }) => ({ url: `/api/partners/${partnerId}/payments/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { partnerId }) => [{ type: 'Partners', id: `payments-${partnerId}` }],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetPartnersQuery,
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
  useDeletePartnerMutation,
  useGetPartnerPaymentsQuery,
  useCreatePartnerPaymentMutation,
  useUpdatePartnerPaymentMutation,
  useDeletePartnerPaymentMutation,
} = partnersApi

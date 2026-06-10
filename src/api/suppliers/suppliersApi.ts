import { baseApi } from '@/api/baseApi'
import { Supplier, SupplierPayment } from '@/lib/types'

export const suppliersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getSuppliers: build.query<Supplier[], { includeInactive?: boolean } | void>({
      query: (arg) => {
        const params = arg && arg.includeInactive ? '?include_inactive=true' : ''
        return `/api/suppliers/${params}`
      },
      transformResponse: (res: { data: Supplier[] }) => res.data,
      providesTags: ['Suppliers'],
    }),

    createSupplier: build.mutation<Supplier, Partial<Supplier>>({
      query: (body) => ({ url: '/api/suppliers/create/', method: 'POST', body }),
      invalidatesTags: ['Suppliers'],
    }),

    updateSupplier: build.mutation<Supplier, { id: string } & Partial<Supplier>>({
      query: ({ id, ...body }) => ({ url: `/api/suppliers/${id}/update/`, method: 'PATCH', body }),
      invalidatesTags: ['Suppliers'],
    }),

    deleteSupplier: build.mutation<void, string>({
      query: (id) => ({ url: `/api/suppliers/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['Suppliers'],
    }),

    getSupplierPayments: build.query<{ payments: SupplierPayment[]; supplier: Supplier }, string>({
      query: (id) => `/api/suppliers/${id}/payments/`,
      transformResponse: (res: { data: { payments: SupplierPayment[]; supplier: Supplier } }) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'Suppliers', id: `payments-${id}` }],
    }),

    createSupplierPayment: build.mutation<SupplierPayment, { supplierId: string; amount: string; paid_date: string; note?: string }>({
      query: ({ supplierId, ...body }) => ({
        url: `/api/suppliers/${supplierId}/payments/create/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { supplierId }) => [
        'Suppliers',
        { type: 'Suppliers', id: `payments-${supplierId}` },
      ],
    }),

    deleteSupplierPayment: build.mutation<void, { supplierId: string; paymentId: string }>({
      query: ({ supplierId, paymentId }) => ({
        url: `/api/suppliers/${supplierId}/payments/${paymentId}/delete/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { supplierId }) => [
        'Suppliers',
        { type: 'Suppliers', id: `payments-${supplierId}` },
      ],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetSupplierPaymentsQuery,
  useCreateSupplierPaymentMutation,
  useDeleteSupplierPaymentMutation,
} = suppliersApi

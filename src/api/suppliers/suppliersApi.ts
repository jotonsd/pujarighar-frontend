import { baseApi } from '@/api/baseApi'
import { Supplier } from '@/lib/types'

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

  }),
  overrideExisting: false,
})

export const {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = suppliersApi

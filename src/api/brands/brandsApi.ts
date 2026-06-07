import { baseApi } from '@/api/baseApi'
import { Brand } from '@/lib/types'

export const brandsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getBrands: build.query<Brand[], { includeInactive?: boolean } | void>({
      query: (params) => ({
        url: '/api/brands/',
        params: params && (params as { includeInactive?: boolean }).includeInactive
          ? { include_inactive: 'true' }
          : undefined,
      }),
      transformResponse: (res: { data: Brand[] }) => res.data,
      providesTags: ['Brands'],
    }),

    createBrand: build.mutation<Brand, FormData>({
      query: (body) => ({ url: '/api/brands/create/', method: 'POST', body }),
      transformResponse: (res: { data: Brand }) => res.data,
      invalidatesTags: ['Brands'],
    }),

    updateBrand: build.mutation<Brand, { id: string; data: FormData | Partial<Brand> }>({
      query: ({ id, data }) => ({ url: `/api/brands/${id}/update/`, method: 'PATCH', body: data }),
      transformResponse: (res: { data: Brand }) => res.data,
      invalidatesTags: ['Brands'],
    }),

    deleteBrand: build.mutation<void, string>({
      query: (id) => ({ url: `/api/brands/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['Brands'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} = brandsApi

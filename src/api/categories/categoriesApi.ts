import { baseApi } from '@/api/baseApi'
import { Category } from '@/lib/types'

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getCategories: build.query<Category[], { includeInactive?: boolean } | void>({
      query: (params) => ({
        url: '/api/categories/',
        params: params && (params as { includeInactive?: boolean }).includeInactive
          ? { include_inactive: 'true' }
          : undefined,
      }),
      transformResponse: (res: { data: Category[] }) => res.data,
      providesTags: ['Categories'],
    }),

    createCategory: build.mutation<Category, Partial<Category>>({
      query: (body) => ({ url: '/api/categories/', method: 'POST', body }),
      transformResponse: (res: { data: Category }) => res.data,
      invalidatesTags: ['Categories'],
    }),

    updateCategory: build.mutation<Category, { id: string } & Partial<Category>>({
      query: ({ id, ...body }) => ({ url: `/api/categories/${id}/update/`, method: 'PATCH', body }),
      transformResponse: (res: { data: Category }) => res.data,
      invalidatesTags: ['Categories'],
    }),

    deleteCategory: build.mutation<void, string>({
      query: (id) => ({ url: `/api/categories/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['Categories'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi

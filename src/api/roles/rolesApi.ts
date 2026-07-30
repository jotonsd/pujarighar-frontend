import { baseApi } from '@/api/baseApi'
import { Permission, Role } from '@/lib/types'

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getRoles: build.query<Role[], void>({
      query: () => '/api/roles/',
      transformResponse: (res: { data: Role[] }) => res.data,
      providesTags: ['Roles'],
    }),

    getPermissionsCatalog: build.query<Permission[], void>({
      query: () => '/api/permissions/',
      transformResponse: (res: { data: Permission[] }) => res.data,
      providesTags: ['Roles'],
    }),

    createRole: build.mutation<Role, { name_bn: string; name_en: string; permission_ids: string[] }>({
      query: (body) => ({ url: '/api/roles/create/', method: 'POST', body }),
      transformResponse: (res: { data: Role }) => res.data,
      invalidatesTags: ['Roles'],
    }),

    updateRole: build.mutation<Role, { id: string; name_bn?: string; name_en?: string; permission_ids?: string[] }>({
      query: ({ id, ...body }) => ({ url: `/api/roles/${id}/update/`, method: 'PATCH', body }),
      transformResponse: (res: { data: Role }) => res.data,
      invalidatesTags: ['Roles'],
    }),

    deleteRole: build.mutation<void, string>({
      query: (id) => ({ url: `/api/roles/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['Roles'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetRolesQuery,
  useGetPermissionsCatalogQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = rolesApi

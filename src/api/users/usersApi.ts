import { baseApi } from '@/api/baseApi'
import { User, Role, ApiMeta } from '@/lib/types'

interface UserListResponse { data: User[]; pagination: ApiMeta }

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getUsers: build.query<UserListResponse, { page?: number; role?: string; search?: string }>({
      query: ({ page = 1, role = '', search = '' } = {}) => {
        const p = new URLSearchParams({ page: String(page) })
        if (role)   p.set('role', role)
        if (search) p.set('search', search)
        return `/api/users/?${p}`
      },
      providesTags: ['Users'],
    }),

    getUser: build.query<User, string>({
      query: (id) => `/api/users/${id}/`,
      transformResponse: (res: { data: User }) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),

    getDeliveryPersons: build.query<User[], void>({
      query: () => '/api/users/delivery-persons/',
      transformResponse: (res: { data: User[] }) => res.data,
      providesTags: ['DeliveryPersons'],
    }),

    createUser: build.mutation<User, { email: string; phone: string; password: string; role: Role; full_name_bn?: string }>({
      query: (body) => ({ url: '/api/users/create/', method: 'POST', body }),
      transformResponse: (res: { data: User }) => res.data,
      invalidatesTags: ['Users'],
    }),

    updateUser: build.mutation<User, { id: string } & Partial<User>>({
      query: ({ id, ...body }) => ({ url: `/api/users/${id}/update/`, method: 'PATCH', body }),
      transformResponse: (res: { data: User }) => res.data,
      invalidatesTags: (_r, _e, { id }) => ['Users', { type: 'User', id }],
    }),

    deleteUser: build.mutation<void, string>({
      query: (id) => ({ url: `/api/users/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['Users'],
    }),

    activateUser: build.mutation<User, string>({
      query: (id) => ({ url: `/api/users/${id}/activate/`, method: 'POST', body: {} }),
      transformResponse: (res: { data: User }) => res.data,
      invalidatesTags: (_r, _e, id) => ['Users', { type: 'User', id }],
    }),

    deactivateUser: build.mutation<User, string>({
      query: (id) => ({ url: `/api/users/${id}/deactivate/`, method: 'POST', body: {} }),
      transformResponse: (res: { data: User }) => res.data,
      invalidatesTags: (_r, _e, id) => ['Users', { type: 'User', id }],
    }),

    changeRole: build.mutation<User, { id: string; role: Role }>({
      query: ({ id, role }) => ({ url: `/api/users/${id}/change-role/`, method: 'POST', body: { role } }),
      transformResponse: (res: { data: User }) => res.data,
      invalidatesTags: (_r, _e, { id }) => ['Users', { type: 'User', id }],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useGetDeliveryPersonsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useChangeRoleMutation,
} = usersApi

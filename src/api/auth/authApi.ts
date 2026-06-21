import { baseApi } from '@/api/baseApi'
import { AuthResponse, User } from '@/lib/types'

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    login: build.mutation<AuthResponse, { identifier: string; password: string }>({
      query: (body) => ({ url: '/api/auth/login/', method: 'POST', body }),
      transformResponse: (res: { data: AuthResponse }) => res.data,
    }),

    googleLogin: build.mutation<AuthResponse, { access_token: string }>({
      query: (body) => ({ url: '/api/auth/google/', method: 'POST', body }),
      transformResponse: (res: { data: AuthResponse }) => res.data,
    }),

    register: build.mutation<AuthResponse, { email: string; phone: string; password: string; full_name_bn: string; full_name_en?: string; referral_code?: string }>({
      query: (body) => ({ url: '/api/auth/register/', method: 'POST', body }),
      transformResponse: (res: { data: AuthResponse }) => res.data,
    }),

    logout: build.mutation<void, { refresh: string }>({
      query: (body) => ({ url: '/api/auth/logout/', method: 'POST', body }),
    }),

    forgotPassword: build.mutation<{ message: string }, { email: string; locale: string }>({
      query: (body) => ({ url: '/api/auth/forgot-password/', method: 'POST', body }),
    }),

    resetPassword: build.mutation<{ message: string }, { uid: string; token: string; new_password: string }>({
      query: (body) => ({ url: '/api/auth/reset-password/', method: 'POST', body }),
    }),

    getMe: build.query<User, void>({
      query: () => '/api/users/me/',
      transformResponse: (res: { data: User }) => res.data,
      providesTags: ['User'],
    }),

    updateMe: build.mutation<User, FormData | Partial<User['profile']>>({
      query: (body) => ({ url: '/api/users/me/update/', method: 'PATCH', body }),
      transformResponse: (res: { data: User }) => res.data,
      invalidatesTags: ['User'],
    }),

    changePassword: build.mutation<void, { old_password: string; new_password: string }>({
      query: (body) => ({ url: '/api/users/me/change-password/', method: 'POST', body }),
    }),

    lookupUserByPhone: build.query<User, string>({
      query: (phone) => `/api/users/lookup-by-phone/?phone=${encodeURIComponent(phone)}`,
      transformResponse: (res: { data: User }) => res.data,
    }),

  }),
  overrideExisting: false,
})

export const {
  useLoginMutation,
  useGoogleLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useLookupUserByPhoneQuery,
} = authApi

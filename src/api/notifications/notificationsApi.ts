import { baseApi } from '@/api/baseApi'
import { ApiMeta } from '@/lib/types'

export interface AppNotification {
  id: string
  title_bn: string
  title_en: string
  body_bn: string
  body_en: string
  is_read: boolean
  reference_type: string
  reference_id: string | null
  created_at: string
}

interface NotificationListResponse {
  notifications: AppNotification[]
  unread_count: number
}

interface AllNotificationsResponse {
  data: AppNotification[]
  pagination: ApiMeta
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getNotifications: build.query<NotificationListResponse, void>({
      query: () => '/api/notifications/',
      transformResponse: (res: { data: NotificationListResponse }) => res.data,
      providesTags: ['Notifications'],
    }),

    getAllNotifications: build.query<AllNotificationsResponse, { page?: number; page_size?: number; is_read?: boolean } | void>({
      query: (params) => {
        const p = new URLSearchParams()
        if (params?.page)      p.set('page', String(params.page))
        if (params?.page_size) p.set('page_size', String(params.page_size))
        if (params?.is_read !== undefined) p.set('is_read', String(params.is_read))
        return `/api/notifications/all/?${p.toString()}`
      },
      providesTags: ['Notifications'],
    }),

    markAllRead: build.mutation<void, void>({
      query: () => ({ url: '/api/notifications/mark-all-read/', method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),

    markOneRead: build.mutation<void, string>({
      query: (id) => ({ url: `/api/notifications/${id}/mark-read/`, method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetNotificationsQuery,
  useGetAllNotificationsQuery,
  useMarkAllReadMutation,
  useMarkOneReadMutation,
} = notificationsApi

import { baseApi } from '@/api/baseApi'

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

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getNotifications: build.query<NotificationListResponse, void>({
      query: () => '/api/notifications/',
      transformResponse: (res: { data: NotificationListResponse }) => res.data,
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
  useMarkAllReadMutation,
  useMarkOneReadMutation,
} = notificationsApi

import { baseApi } from '@/api/baseApi'

export interface SmsSettings {
  has_sms_api_key: boolean
  sms_sender_id:   string
}

// sms_api_key is write-only — sent on update, never read back
export type SmsSettingsUpdate = { sms_api_key?: string; sms_sender_id?: string }

export interface SmsLogRow {
  id:            string
  order_number:  string | null
  phone:         string
  message:       string
  status:        'SUCCESS' | 'FAILED'
  response_code: string
  response_text: string
  created_at:    string
}

export interface SmsStats {
  total:   number
  success: number
  failed:  number
}

interface ApiMetaLike { page: number; page_size: number; total: number; total_pages: number }
interface SmsLogListResponse { data: SmsLogRow[]; pagination: ApiMetaLike }

type SmsLogParams = { page?: number; status?: string; phone?: string; from?: string; to?: string }
type SmsStatsParams = { from?: string; to?: string }

export const smsApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getSmsSettings: build.query<SmsSettings, void>({
      query: () => '/api/sms/settings/',
      transformResponse: (res: { data: SmsSettings }) => res.data,
      providesTags: ['SmsSettings'],
    }),
    updateSmsSettings: build.mutation<SmsSettings, SmsSettingsUpdate>({
      query: body => ({ url: '/api/sms/settings/update/', method: 'PATCH', body }),
      transformResponse: (res: { data: SmsSettings }) => res.data,
      invalidatesTags: ['SmsSettings'],
    }),
    getSmsLogs: build.query<SmsLogListResponse, SmsLogParams | void>({
      query: ({ page = 1, status = '', phone = '', from = '', to = '' }: SmsLogParams = {}) => {
        const p = new URLSearchParams({ page: String(page) })
        if (status) p.set('status', status)
        if (phone)  p.set('phone', phone)
        if (from)   p.set('from', from)
        if (to)     p.set('to', to)
        return `/api/sms/logs/?${p}`
      },
      providesTags: ['SmsLogs'],
    }),
    getSmsStats: build.query<SmsStats, SmsStatsParams | void>({
      query: ({ from = '', to = '' }: SmsStatsParams = {}) => {
        const p = new URLSearchParams()
        if (from) p.set('from', from)
        if (to)   p.set('to', to)
        return `/api/sms/stats/?${p}`
      },
      transformResponse: (res: { data: SmsStats }) => res.data,
      providesTags: ['SmsLogs'],
    }),
  }),
})

export const {
  useGetSmsSettingsQuery,
  useUpdateSmsSettingsMutation,
  useGetSmsLogsQuery,
  useGetSmsStatsQuery,
} = smsApi

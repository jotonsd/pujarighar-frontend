import { baseApi } from '@/api/baseApi'
import { ApiMeta } from '@/lib/types'

export interface PromoPush {
  id: string
  title_bn: string
  title_en: string
  body_bn: string
  body_en: string
  image_url: string | null
  sent_by: string | null
  recipient_count: number
  delivered_count: number
  created_at: string
}

export interface PromoPushListResponse {
  data: PromoPush[]
  pagination: ApiMeta
}

export interface SendPromoPushPayload {
  title_bn: string
  title_en: string
  body_bn: string
  body_en: string
  image?: File | null
}

export const promoPushApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getPromoPushes: build.query<PromoPushListResponse, { page?: number; page_size?: number } | void>({
      query: (params) => {
        const p = new URLSearchParams()
        if (params?.page)      p.set('page', String(params.page))
        if (params?.page_size) p.set('page_size', String(params.page_size))
        return `/api/promo-notifications/?${p.toString()}`
      },
      providesTags: ['PromoPush'],
    }),

    sendPromoPush: build.mutation<PromoPush, SendPromoPushPayload>({
      query: ({ image, ...fields }) => {
        const body = new FormData()
        Object.entries(fields).forEach(([k, v]) => body.append(k, v))
        if (image) body.append('image', image)
        return { url: '/api/promo-notifications/send/', method: 'POST', body, formData: true }
      },
      transformResponse: (res: { data: PromoPush }) => res.data,
      invalidatesTags: ['PromoPush'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetPromoPushesQuery,
  useSendPromoPushMutation,
} = promoPushApi

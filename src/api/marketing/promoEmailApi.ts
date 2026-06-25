import { baseApi } from '@/api/baseApi'
import { ApiMeta } from '@/lib/types'

export type PromoEmailType = 'NEW_PRODUCT' | 'NEW_PACKAGE' | 'OFFER' | 'GENERAL'
export type PromoEmailStatus = 'PENDING' | 'SENT' | 'FAILED'

export interface PromoEmail {
  id: string
  email_type: PromoEmailType
  subject_bn: string
  subject_en: string
  message_bn: string
  message_en: string
  status: PromoEmailStatus
  recipient_count: number
  sent_by_name: string | null
  sent_at: string | null
  created_at: string
}

export interface PromoEmailListResponse {
  data: PromoEmail[]
  pagination: ApiMeta
}

export interface CreatePromoEmailPayload {
  email_type: PromoEmailType
  subject_bn: string
  subject_en: string
  message_bn: string
  message_en: string
}

export const promoEmailApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getPromoEmails: build.query<PromoEmailListResponse, { page?: number; page_size?: number } | void>({
      query: (params) => {
        const p = new URLSearchParams()
        if (params?.page)      p.set('page', String(params.page))
        if (params?.page_size) p.set('page_size', String(params.page_size))
        return `/api/promo-emails/?${p.toString()}`
      },
      providesTags: ['PromoEmails'],
    }),

    getPromoEmailAudience: build.query<{ recipient_count: number }, PromoEmailType>({
      query: (email_type) => `/api/promo-emails/audience/?email_type=${email_type}`,
      transformResponse: (res: { data: { recipient_count: number } }) => res.data,
    }),

    createPromoEmail: build.mutation<PromoEmail, CreatePromoEmailPayload>({
      query: (body) => ({ url: '/api/promo-emails/create/', method: 'POST', body }),
      transformResponse: (res: { data: PromoEmail }) => res.data,
      invalidatesTags: ['PromoEmails'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetPromoEmailsQuery,
  useGetPromoEmailAudienceQuery,
  useCreatePromoEmailMutation,
} = promoEmailApi

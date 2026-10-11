import { baseApi } from '@/api/baseApi'

export interface PromoPopup {
  id: string
  image: string | null
  image_width: number | null
  image_height: number | null
  link: string
  valid_from: string | null
  valid_until: string | null
  order: number
  is_active: boolean
  created_at: string
}

export const promoPopupsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getActivePromoPopup: build.query<PromoPopup | null, void>({
      query: () => '/api/promo-popups/active/',
      // ApiResponse coerces a None data payload to {} (see api/utils/response.py),
      // so "no active popup" arrives as an empty object, not null — normalize
      // it back to null here rather than leaking that backend quirk further.
      transformResponse: (res: { data: PromoPopup | Record<string, never> }) =>
        (res.data && 'id' in res.data ? (res.data as PromoPopup) : null),
      providesTags: ['PromoPopups'],
    }),

    getAllPromoPopups: build.query<PromoPopup[], void>({
      query: () => '/api/promo-popups/all/',
      transformResponse: (res: { data: PromoPopup[] }) => res.data,
      providesTags: ['PromoPopups'],
    }),

    createPromoPopup: build.mutation<PromoPopup, FormData>({
      query: (body) => ({ url: '/api/promo-popups/create/', method: 'POST', body, formData: true }),
      transformResponse: (res: { data: PromoPopup }) => res.data,
      invalidatesTags: ['PromoPopups'],
    }),

    updatePromoPopup: build.mutation<PromoPopup, { id: string; data: FormData }>({
      query: ({ id, data }) => ({ url: `/api/promo-popups/${id}/update/`, method: 'PATCH', body: data, formData: true }),
      transformResponse: (res: { data: PromoPopup }) => res.data,
      invalidatesTags: ['PromoPopups'],
    }),

    deletePromoPopup: build.mutation<void, string>({
      query: (id) => ({ url: `/api/promo-popups/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['PromoPopups'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetActivePromoPopupQuery,
  useGetAllPromoPopupsQuery,
  useCreatePromoPopupMutation,
  useUpdatePromoPopupMutation,
  useDeletePromoPopupMutation,
} = promoPopupsApi

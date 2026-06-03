import { baseApi } from '@/api/baseApi'

export interface Banner {
  id: string
  title_bn: string
  title_en: string
  subtitle_bn: string
  subtitle_en: string
  badge_text: string
  image: string | null
  bg_color: string
  link: string
  order: number
  is_active: boolean
  created_at: string
}

export const bannersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getBanners: build.query<Banner[], void>({
      query: () => '/api/banners/',
      transformResponse: (res: { data: Banner[] }) => res.data,
      providesTags: ['Banners'],
    }),

    getAllBanners: build.query<Banner[], void>({
      query: () => '/api/banners/all/',
      transformResponse: (res: { data: Banner[] }) => res.data,
      providesTags: ['Banners'],
    }),

    createBanner: build.mutation<Banner, FormData>({
      query: (body) => ({ url: '/api/banners/create/', method: 'POST', body, formData: true }),
      transformResponse: (res: { data: Banner }) => res.data,
      invalidatesTags: ['Banners'],
    }),

    updateBanner: build.mutation<Banner, { id: string; data: FormData }>({
      query: ({ id, data }) => ({ url: `/api/banners/${id}/update/`, method: 'PATCH', body: data, formData: true }),
      transformResponse: (res: { data: Banner }) => res.data,
      invalidatesTags: ['Banners'],
    }),

    deleteBanner: build.mutation<void, string>({
      query: (id) => ({ url: `/api/banners/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['Banners'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetBannersQuery,
  useGetAllBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} = bannersApi

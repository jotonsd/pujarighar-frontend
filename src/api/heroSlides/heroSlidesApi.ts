import { baseApi } from '@/api/baseApi'

export interface HeroSlide {
  id: string
  title_bn: string
  title_en: string
  subtitle_bn: string
  subtitle_en: string
  cta_label_bn: string
  cta_label_en: string
  cta_link: string
  image: string | null
  bg_color: string
  order: number
  is_active: boolean
  created_at: string
}

export const heroSlidesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getHeroSlides: build.query<HeroSlide[], void>({
      query: () => '/api/hero-slides/',
      transformResponse: (res: { data: HeroSlide[] }) => res.data,
      providesTags: ['HeroSlides'],
    }),

    getAllHeroSlides: build.query<HeroSlide[], void>({
      query: () => '/api/hero-slides/all/',
      transformResponse: (res: { data: HeroSlide[] }) => res.data,
      providesTags: ['HeroSlides'],
    }),

    createHeroSlide: build.mutation<HeroSlide, FormData>({
      query: (body) => ({ url: '/api/hero-slides/create/', method: 'POST', body, formData: true }),
      transformResponse: (res: { data: HeroSlide }) => res.data,
      invalidatesTags: ['HeroSlides'],
    }),

    updateHeroSlide: build.mutation<HeroSlide, { id: string; data: FormData }>({
      query: ({ id, data }) => ({ url: `/api/hero-slides/${id}/update/`, method: 'PATCH', body: data, formData: true }),
      transformResponse: (res: { data: HeroSlide }) => res.data,
      invalidatesTags: ['HeroSlides'],
    }),

    deleteHeroSlide: build.mutation<void, string>({
      query: (id) => ({ url: `/api/hero-slides/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['HeroSlides'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetHeroSlidesQuery,
  useGetAllHeroSlidesQuery,
  useCreateHeroSlideMutation,
  useUpdateHeroSlideMutation,
  useDeleteHeroSlideMutation,
} = heroSlidesApi

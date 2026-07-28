import { baseApi } from '@/api/baseApi'
import { BlogPost } from '@/lib/types'

interface PaginatedResponse<T> {
  data: T[]
  pagination?: { count: number; next: string | null; previous: string | null }
}

export const blogApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getBlogPosts: build.query<BlogPost[], void>({
      query: () => '/api/blog/',
      transformResponse: (res: PaginatedResponse<BlogPost>) => res.data,
      providesTags: ['BlogPosts'],
    }),

    getAllBlogPosts: build.query<BlogPost[], void>({
      query: () => '/api/blog/all/',
      transformResponse: (res: PaginatedResponse<BlogPost>) => res.data,
      providesTags: ['BlogPosts'],
    }),

    getBlogPost: build.query<BlogPost, string>({
      query: (id) => `/api/blog/${id}/`,
      transformResponse: (res: { data: BlogPost }) => res.data,
      providesTags: ['BlogPosts'],
    }),

    getBlogPostBySlug: build.query<BlogPost, string>({
      query: (slug) => `/api/blog/slug/${slug}/`,
      transformResponse: (res: { data: BlogPost }) => res.data,
      providesTags: ['BlogPosts'],
    }),

    createBlogPost: build.mutation<BlogPost, FormData>({
      query: (body) => ({ url: '/api/blog/create/', method: 'POST', body, formData: true }),
      transformResponse: (res: { data: BlogPost }) => res.data,
      invalidatesTags: ['BlogPosts'],
    }),

    updateBlogPost: build.mutation<BlogPost, { id: string; data: FormData }>({
      query: ({ id, data }) => ({ url: `/api/blog/${id}/update/`, method: 'PATCH', body: data, formData: true }),
      transformResponse: (res: { data: BlogPost }) => res.data,
      invalidatesTags: ['BlogPosts'],
    }),

    deleteBlogPost: build.mutation<void, string>({
      query: (id) => ({ url: `/api/blog/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['BlogPosts'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetBlogPostsQuery,
  useGetAllBlogPostsQuery,
  useGetBlogPostQuery,
  useGetBlogPostBySlugQuery,
  useCreateBlogPostMutation,
  useUpdateBlogPostMutation,
  useDeleteBlogPostMutation,
} = blogApi

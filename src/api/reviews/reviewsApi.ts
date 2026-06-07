import { baseApi } from '@/api/baseApi'
import { Review } from '@/lib/types'

export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getEligibleOrderForProduct: build.query<{ order_id: string | null }, string>({
      query: (productId) => `/api/products/${productId}/eligible-order/`,
      transformResponse: (res: { data: { order_id: string | null } }) => res.data,
      providesTags: (_result, _err, productId) => [{ type: 'Reviews', id: `eligible-${productId}` }],
    }),

    getProductReviews: build.query<Review[], string>({
      query: (productId) => `/api/products/${productId}/reviews/`,
      transformResponse: (res: { data: Review[] }) => res.data,
      providesTags: (_result, _err, productId) => [{ type: 'Reviews', id: productId }],
    }),

    getMyOrderReviews: build.query<Review[], string>({
      query: (orderId) => ({ url: '/api/reviews/my-order/', params: { order_id: orderId } }),
      transformResponse: (res: { data: Review[] }) => res.data,
      providesTags: (_result, _err, orderId) => [{ type: 'Reviews', id: `order-${orderId}` }],
    }),

    createReview: build.mutation<Review, { product_id: string; order_id: string; rating: number; comment: string }>({
      query: (body) => ({ url: '/api/reviews/', method: 'POST', body }),
      transformResponse: (res: { data: Review }) => res.data,
      invalidatesTags: (_result, _err, arg) => [
        { type: 'Reviews', id: arg.product_id },
        { type: 'Reviews', id: `order-${arg.order_id}` },
        { type: 'Reviews', id: `eligible-${arg.product_id}` },
      ],
    }),

    getPendingReviews: build.query<Review[], void>({
      query: () => '/api/reviews/pending/',
      transformResponse: (res: { data: Review[] }) => res.data,
      providesTags: [{ type: 'Reviews', id: 'pending' }],
    }),

    approveReview: build.mutation<Review, string>({
      query: (id) => ({ url: `/api/reviews/${id}/approve/`, method: 'PATCH' }),
      transformResponse: (res: { data: Review }) => res.data,
      invalidatesTags: [{ type: 'Reviews', id: 'pending' }],
    }),

    deleteReview: build.mutation<void, string>({
      query: (id) => ({ url: `/api/reviews/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Reviews', id: 'pending' }],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetEligibleOrderForProductQuery,
  useGetProductReviewsQuery,
  useGetMyOrderReviewsQuery,
  useCreateReviewMutation,
  useGetPendingReviewsQuery,
  useApproveReviewMutation,
  useDeleteReviewMutation,
} = reviewsApi

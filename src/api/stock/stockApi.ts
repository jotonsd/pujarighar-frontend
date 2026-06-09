import { baseApi } from '@/api/baseApi'
import { StockMovement, PackageItem } from '@/lib/types'

interface StockDetail {
  stock_on_hand: string
  movements: StockMovement[]
}

export const stockApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getStock: build.query<StockDetail, string>({
      query: (productId) => `/api/products/${productId}/stock/`,
      transformResponse: (res: { data: StockDetail }) => res.data,
      providesTags: (_r, _e, productId) => [{ type: 'Stock', id: productId }],
    }),

    adjustStock: build.mutation<void, { productId: string; movement_type: string; quantity: number; unit_cost?: number; unit_price?: number; supplier_id?: string; supplier_name?: string; payment_method?: 'CASH' | 'CREDIT'; note_bn?: string; note_en?: string }>({
      query: ({ productId, ...body }) => ({
        url: `/api/products/${productId}/stock/adjust/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { productId }) => [{ type: 'Stock', id: productId }, 'Products'],
    }),

    getPackageItems: build.query<PackageItem[], string>({
      query: (productId) => `/api/products/${productId}/package-items/`,
      transformResponse: (res: { data: PackageItem[] }) => res.data,
      providesTags: (_r, _e, productId) => [{ type: 'Product', id: productId }],
    }),

    addPackageItem: build.mutation<void, { productId: string; component_id: string; quantity: string }>({
      query: ({ productId, ...body }) => ({
        url: `/api/products/${productId}/package-items/add/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { productId }) => [{ type: 'Product', id: productId }],
    }),

    deletePackageItem: build.mutation<void, { productId: string; itemId: string }>({
      query: ({ productId, itemId }) => ({
        url: `/api/products/${productId}/package-items/${itemId}/delete/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { productId }) => [{ type: 'Product', id: productId }],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetStockQuery,
  useAdjustStockMutation,
  useGetPackageItemsQuery,
  useAddPackageItemMutation,
  useDeletePackageItemMutation,
} = stockApi

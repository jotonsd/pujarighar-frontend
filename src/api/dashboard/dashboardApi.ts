import { baseApi } from '@/api/baseApi'

export interface DashboardSummary {
  today_orders: number
  today_revenue: string
  pending_orders: number
  low_stock_count: number
  total_customers: number
  total_products: number
  monthly_revenue_chart: { month: string; revenue: string; expense: string }[]
  status_breakdown: { status: string; count: number }[]
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getDashboardSummary: build.query<DashboardSummary, void>({
      query: () => '/api/dashboard/summary/',
      transformResponse: (res: { data: DashboardSummary }) => res.data,
      providesTags: ['Dashboard'],
    }),

  }),
  overrideExisting: false,
})

export const { useGetDashboardSummaryQuery } = dashboardApi

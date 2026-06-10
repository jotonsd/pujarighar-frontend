import { baseApi } from '@/api/baseApi'

export interface RecentOrder {
  id: string
  order_number: string
  name_bn: string
  name_en: string
  grand_total: string
  status: string
  created_at: string
}

export interface TopProduct {
  id: string
  name_bn: string
  name_en: string
  revenue: string
}

export interface DashboardSummary {
  // existing
  today_orders: number
  today_revenue: string
  pending_orders: number
  low_stock_count: number
  total_customers: number
  total_products: number
  monthly_revenue_chart: { month: string; revenue: string; expense: string }[]
  status_breakdown: { status: string; count: number }[]
  // new
  this_month_revenue: string
  last_month_revenue: string
  this_month_profit: string
  revenue_change_pct: number | null
  supplier_outstanding: string
  loan_outstanding: string
  partner_outstanding: string
  out_of_stock_count: number
  recent_orders: RecentOrder[]
  top_products: TopProduct[]
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

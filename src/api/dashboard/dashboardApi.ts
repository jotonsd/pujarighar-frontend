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

export interface DashboardSummaryParams {
  from?: string
  to?: string
}

export interface DashboardSummary {
  // existing
  week_orders: number
  week_revenue: string
  pending_orders: number
  low_stock_count: number
  total_customers: number
  total_products: number
  monthly_revenue_chart: { month: string; revenue: string; expense: string }[]
  order_comparison_chart: {
    day: number
    this_month: number
    this_month_amount: string
    last_month: number
    last_month_amount: string
    this_month_processing: number
    this_month_processing_amount: string
  }[]
  status_breakdown: { status: string; count: number }[]
  // new
  this_month_revenue: string
  last_month_revenue: string
  this_month_expense: string
  this_month_profit: string
  revenue_change_pct: number | null
  supplier_outstanding: string
  loan_outstanding: string
  partner_outstanding: string
  cash_on_hand: string
  cash_account_id: string | null
  out_of_stock_count: number
  total_stock_value: string
  cash_stock_value: string
  credit_stock_value: string
  this_month_orders: number
  this_month_sales_amount: string
  recent_orders: RecentOrder[]
  top_products: TopProduct[]
  period_from: string
  period_to: string
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getDashboardSummary: build.query<DashboardSummary, DashboardSummaryParams | void>({
      query: (params) => {
        const qs = new URLSearchParams()
        if (params?.from) qs.set('from', params.from)
        if (params?.to) qs.set('to', params.to)
        const suffix = qs.toString()
        return `/api/dashboard/summary/${suffix ? `?${suffix}` : ''}`
      },
      transformResponse: (res: { data: DashboardSummary }) => res.data,
      providesTags: ['Dashboard'],
    }),

  }),
  overrideExisting: false,
})

export const { useGetDashboardSummaryQuery } = dashboardApi

import { baseApi } from '@/api/baseApi'

export interface GoogleStatus {
  is_connected: boolean
  ga4_property_id: string
  ga4_property_name: string
  gsc_site_url: string
  connected_at: string | null
  has_selection: boolean
}

export interface Ga4Property {
  property_id: string
  display_name: string
  account_name: string
}

export interface GscSite {
  site_url: string
  permission_level: string
}

export interface GoogleProperties {
  ga4_properties: Ga4Property[]
  gsc_sites: GscSite[]
}

export interface DateRangeParams {
  from: string
  to: string
}

export interface TrafficDailyPoint {
  date: string
  sessions: number
  total_users: number
  new_users: number
}

export interface TrafficSource {
  source: string
  sessions: number
}

export interface TrafficMetrics {
  sessions_total: number
  users_total: number
  new_users_total: number
  returning_users_total: number
  daily: TrafficDailyPoint[]
  top_traffic_sources: TrafficSource[]
}

export interface TopSellingProduct {
  name: string
  units_sold: number
  revenue: number
}

export interface SalesMetrics {
  add_to_cart_count: number
  checkout_starts: number
  purchases: number
  revenue: number
  conversion_rate: number
  average_order_value: number
  cart_abandonment_rate: number
  top_selling_products: TopSellingProduct[]
}

export interface SeoDailyPoint {
  date: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SeoQueryRow {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SeoPageRow {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface IndexedPagesEstimate {
  available: boolean
  indexed: number
  submitted: number
}

export interface CoreWebVitalsBucket {
  good: number
  needs_improvement: number
  poor: number
}

export interface CoreWebVitals {
  available: boolean
  reason?: string
  largest_contentful_paint?: CoreWebVitalsBucket | null
  interaction_to_next_paint?: CoreWebVitalsBucket | null
  cumulative_layout_shift?: CoreWebVitalsBucket | null
}

export interface SeoMetrics {
  clicks_total: number
  impressions_total: number
  ctr_total: number
  avg_position: number
  daily: SeoDailyPoint[]
  top_queries: SeoQueryRow[]
  top_pages: SeoPageRow[]
  indexed_pages_estimate: IndexedPagesEstimate
  core_web_vitals: CoreWebVitals
}

export interface PagespeedSeoIssue {
  title: string
  description: string
}

export type PagespeedCategory = 'performance' | 'accessibility' | 'best_practices' | 'seo'

export interface PagespeedSeo {
  available: boolean
  reason?: string
  strategy?: string
  scores?: Record<PagespeedCategory, number | null>
  failing_issues?: Record<PagespeedCategory, PagespeedSeoIssue[]>
  lab_metrics?: Record<string, string>
}

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getGoogleStatus: build.query<GoogleStatus, void>({
      query: () => '/api/analytics/google/status/',
      transformResponse: (res: { data: GoogleStatus }) => res.data,
      providesTags: ['GoogleAnalytics'],
    }),

    getGoogleConnectUrl: build.query<{ auth_url: string }, void>({
      query: () => '/api/analytics/google/connect-url/',
      transformResponse: (res: { data: { auth_url: string } }) => res.data,
    }),

    getGoogleProperties: build.query<GoogleProperties, void>({
      query: () => '/api/analytics/google/properties/',
      transformResponse: (res: { data: GoogleProperties }) => res.data,
    }),

    selectGoogleProperty: build.mutation<GoogleStatus, { ga4_property_id: string; ga4_property_name: string; gsc_site_url: string }>({
      query: (body) => ({ url: '/api/analytics/google/select/', method: 'POST', body }),
      transformResponse: (res: { data: GoogleStatus }) => res.data,
      invalidatesTags: ['GoogleAnalytics'],
    }),

    disconnectGoogle: build.mutation<void, void>({
      query: () => ({ url: '/api/analytics/google/disconnect/', method: 'POST' }),
      invalidatesTags: ['GoogleAnalytics'],
    }),

    getTrafficMetrics: build.query<TrafficMetrics, DateRangeParams>({
      query: ({ from, to }) => `/api/analytics/traffic/?from=${from}&to=${to}`,
      transformResponse: (res: { data: TrafficMetrics }) => res.data,
      providesTags: ['GoogleAnalytics'],
    }),

    getSalesMetrics: build.query<SalesMetrics, DateRangeParams>({
      query: ({ from, to }) => `/api/analytics/sales/?from=${from}&to=${to}`,
      transformResponse: (res: { data: SalesMetrics }) => res.data,
      providesTags: ['GoogleAnalytics'],
    }),

    getSeoMetrics: build.query<SeoMetrics, DateRangeParams>({
      query: ({ from, to }) => `/api/analytics/seo/?from=${from}&to=${to}`,
      transformResponse: (res: { data: SeoMetrics }) => res.data,
      providesTags: ['GoogleAnalytics'],
    }),

    getPagespeedSeo: build.query<PagespeedSeo, { strategy: 'MOBILE' | 'DESKTOP' }>({
      query: ({ strategy }) => `/api/analytics/seo/pagespeed/?strategy=${strategy}`,
      transformResponse: (res: { data: PagespeedSeo }) => res.data,
      providesTags: ['GoogleAnalytics'],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetGoogleStatusQuery,
  useLazyGetGoogleConnectUrlQuery,
  useGetGooglePropertiesQuery,
  useSelectGooglePropertyMutation,
  useDisconnectGoogleMutation,
  useGetTrafficMetricsQuery,
  useGetSalesMetricsQuery,
  useGetSeoMetricsQuery,
  useGetPagespeedSeoQuery,
} = analyticsApi

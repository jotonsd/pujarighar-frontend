import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import Cookies from 'js-cookie'
import { getGuestId } from '@/lib/guestId'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  prepareHeaders: (headers) => {
    const token  = Cookies.get('access_token')
    const locale = Cookies.get('locale') ?? 'bn'
    if (token) headers.set('Authorization', `Bearer ${token}`)
    else headers.set('X-Guest-Id', getGuestId())
    headers.set('Accept-Language', locale)
    return headers
  },
})

// REFRESH_TOKEN_LIFETIME on the backend is 7 days, with ROTATE_REFRESH_TOKENS +
// BLACKLIST_AFTER_ROTATION on — every refresh call invalidates the old refresh
// token, so the new one returned here MUST be persisted or the next refresh fails.
const REFRESH_COOKIE_DAYS = 7

// Multiple RTK Query endpoints can 401 at the same moment (e.g. a dashboard firing
// several queries on mount right after login). With rotating refresh tokens, only
// the first concurrent refresh call would succeed and the rest would get rejected
// (their token already rotated away) — forcing a bogus logout. This shared,
// in-flight promise makes every 401'd caller await the same single refresh attempt.
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2],
): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refresh = Cookies.get('refresh_token')
    if (!refresh) return null

    const refreshResult = await rawBaseQuery(
      { url: '/api/auth/token/refresh/', method: 'POST', body: { refresh } },
      api,
      extraOptions,
    )

    if (refreshResult.data) {
      const { access, refresh: newRefresh } = refreshResult.data as { access: string; refresh?: string }
      Cookies.set('access_token', access, { expires: 1 / 24, sameSite: 'lax' })
      if (newRefresh) Cookies.set('refresh_token', newRefresh, { expires: REFRESH_COOKIE_DAYS, sameSite: 'lax' })
      return access
    }

    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    Cookies.remove('user')
    // Skip the hard redirect if we're already on an auth page — otherwise a
    // failed refresh triggered from /auth/login itself (e.g. a stale cookie
    // check) reloads that same page, which re-fires the check and reloads
    // again: an infinite loop instead of just showing the login form as-is.
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
      const locale = Cookies.get('locale') ?? 'bn'
      window.location.href = `/${locale}/auth/login`
    }
    return null
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    const access = await refreshAccessToken(api, extraOptions)
    if (access) {
      result = await rawBaseQuery(args, api, extraOptions)
    }
  }
  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Products', 'Product',
    'Categories',
    'Brands',
    'Cart',
    'Orders', 'Order', 'OrderLogs',
    'Users', 'User', 'DeliveryPersons',
    'Accounts', 'JournalEntries', 'Ledger',
    'Dashboard',
    'Stock',
    'PackageItems',
    'Banners',
    'HeroSlides',
    'ShippingAddresses',
    'UserAddresses',
    'Notifications',
    'Discounts',
    'DeliveryCharges',
    'Reviews',
    'Suppliers',
    'Partners',
    'Loans',
    'Cashback',
    'SiteSettings',
    'PromoEmails',
    'GoogleAnalytics',
    'GooglePagespeed',
    'CourierProviders',
    'CourierConsignments',
    'CourierReturnRequests',
    'BlogPosts',
    'Roles',
    'Bayna',
  ],
  endpoints: () => ({}),
})

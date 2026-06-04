import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import Cookies from 'js-cookie'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  prepareHeaders: (headers) => {
    const token  = Cookies.get('access_token')
    const locale = Cookies.get('locale') ?? 'bn'
    if (token) headers.set('Authorization', `Bearer ${token}`)
    headers.set('Accept-Language', locale)
    return headers
  },
})

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    const refresh = Cookies.get('refresh_token')
    if (refresh) {
      const refreshResult = await rawBaseQuery(
        { url: '/api/auth/token/refresh/', method: 'POST', body: { refresh } },
        api,
        extraOptions,
      )
      if (refreshResult.data) {
        const { access } = refreshResult.data as { access: string }
        Cookies.set('access_token', access, { expires: 1 / 24 })
        result = await rawBaseQuery(args, api, extraOptions)
      } else {
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        if (typeof window !== 'undefined') {
          const locale = Cookies.get('locale') ?? 'bn'
          window.location.href = `/${locale}/auth/login`
        }
      }
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
    'Notifications',
  ],
  endpoints: () => ({}),
})

import { baseApi } from '@/api/baseApi'
import Cookies from 'js-cookie'

export interface LogFile {
  name: string
  size: number
  modified_at: number
}

export interface LogContent {
  name: string
  lines: string[]
}

export const logsApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getLogFiles: build.query<LogFile[], void>({
      query: () => '/api/logs/',
      transformResponse: (res: { data: LogFile[] }) => res.data,
    }),
    getLogContent: build.query<LogContent, { filename: string; lines?: number; q?: string }>({
      query: ({ filename, lines, q }) => ({
        url: `/api/logs/${filename}/`,
        params: { lines, q: q || undefined },
      }),
      transformResponse: (res: { data: LogContent }) => res.data,
    }),
    // Hits our OWN Next.js route (not baseApi's Django baseUrl) — that route
    // clears Django's cache AND revalidates Next's entire fetch-cache tree in
    // one call, so this needs a custom queryFn instead of the shared
    // fetchBaseQuery, which is pinned to the Django API origin.
    clearCache: build.mutation<void, void>({
      queryFn: async () => {
        try {
          const res = await fetch('/api/admin/clear-cache', {
            method: 'POST',
            headers: { Authorization: `Bearer ${Cookies.get('access_token')}` },
          })
          if (!res.ok) return { error: { status: res.status, data: null } }
          return { data: undefined }
        } catch (e) {
          return { error: { status: 'FETCH_ERROR', error: String(e) } }
        }
      },
    }),
  }),
})

export const { useGetLogFilesQuery, useGetLogContentQuery, useClearCacheMutation } = logsApi

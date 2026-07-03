import { baseApi } from '@/api/baseApi'

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
  }),
})

export const { useGetLogFilesQuery, useGetLogContentQuery } = logsApi

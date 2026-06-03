import { baseApi } from '@/api/baseApi'
import { Account, JournalEntry, ApiMeta } from '@/lib/types'

interface JournalListResponse { data: JournalEntry[]; meta: ApiMeta }

interface LedgerLine {
  date: string; entry_number: string; description: string
  debit: string; credit: string; balance: string
}
interface LedgerData {
  account: Account
  opening_balance: string
  closing_balance: string
  lines: LedgerLine[]
}
interface TrialBalanceRow {
  account: { code: string; name_bn: string; name_en: string }
  debit: string
  credit: string
}
interface ProfitLossData { revenue: string; expense: string; net_profit: string }

export const accountingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getAccounts: build.query<Account[], void>({
      query: () => '/api/accounting/accounts/',
      transformResponse: (res: { data: Account[] }) => res.data,
      providesTags: ['Accounts'],
    }),

    getJournalEntries: build.query<JournalListResponse, { page?: number }>({
      query: ({ page = 1 } = {}) => `/api/accounting/journal-entries/?page=${page}`,
      providesTags: ['JournalEntries'],
    }),

    getLedger: build.query<LedgerData, { accountId: string; from?: string; to?: string }>({
      query: ({ accountId, from = '', to = '' }) => {
        const p = new URLSearchParams()
        if (from) p.set('from', from)
        if (to)   p.set('to', to)
        return `/api/accounting/ledger/${accountId}/?${p}`
      },
      transformResponse: (res: { data: LedgerData }) => res.data,
      providesTags: ['Ledger'],
    }),

    getTrialBalance: build.query<{ rows: TrialBalanceRow[] }, { asOf?: string }>({
      query: ({ asOf = '' } = {}) =>
        `/api/accounting/reports/trial-balance/${asOf ? `?as_of=${asOf}` : ''}`,
      transformResponse: (res: { data: { rows: TrialBalanceRow[] } }) => res.data,
    }),

    getProfitLoss: build.query<ProfitLossData, { from?: string; to?: string }>({
      query: ({ from = '', to = '' } = {}) => {
        const p = new URLSearchParams()
        if (from) p.set('from', from)
        if (to)   p.set('to', to)
        return `/api/accounting/reports/profit-loss/?${p}`
      },
      transformResponse: (res: { data: ProfitLossData }) => res.data,
    }),

    getSalesSummary: build.query<unknown, { from?: string; to?: string }>({
      query: ({ from = '', to = '' } = {}) => {
        const p = new URLSearchParams()
        if (from) p.set('from', from)
        if (to)   p.set('to', to)
        return `/api/accounting/reports/sales-summary/?${p}`
      },
      transformResponse: (res: { data: unknown }) => res.data,
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetAccountsQuery,
  useGetJournalEntriesQuery,
  useGetLedgerQuery,
  useGetTrialBalanceQuery,
  useGetProfitLossQuery,
  useGetSalesSummaryQuery,
} = accountingApi

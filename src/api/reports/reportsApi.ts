import { baseApi } from '@/api/baseApi'

export interface PurchaseReportRow {
  id: string
  date: string
  product_id: string
  product_name_bn: string
  product_name_en: string
  product_image: string | null
  sku: string
  quantity: string
  unit_cost: string
  line_total: string
  supplier_name: string
  payment_method: 'CASH' | 'CREDIT'
}

export interface PurchaseReport {
  rows: PurchaseReportRow[]
  total_quantity: string
  total_amount: string
}

export interface LedgerReportRow {
  id: string
  date: string
  entry_number: string
  account_id: string
  account_name_bn: string
  account_name_en: string
  description_bn: string
  description_en: string
  reference_type: string
  amount: string
}

export interface LedgerReport {
  rows: LedgerReportRow[]
  total_amount: string
}

type ReportParams = { supplier_id?: string; product_id?: string; from?: string; to?: string }
type LedgerReportParams = { account_id?: string; from?: string; to?: string }

function buildReportQuery(base: string) {
  return ({ supplier_id = '', product_id = '', from = '', to = '' }: ReportParams = {}) => {
    const p = new URLSearchParams()
    if (supplier_id) p.set('supplier_id', supplier_id)
    if (product_id)  p.set('product_id', product_id)
    if (from)        p.set('from', from)
    if (to)          p.set('to', to)
    return `${base}?${p}`
  }
}

function buildLedgerReportQuery(base: string) {
  return ({ account_id = '', from = '', to = '' }: LedgerReportParams = {}) => {
    const p = new URLSearchParams()
    if (account_id) p.set('account_id', account_id)
    if (from)       p.set('from', from)
    if (to)         p.set('to', to)
    return `${base}?${p}`
  }
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getPurchaseReport: build.query<PurchaseReport, ReportParams | void>({
      query: buildReportQuery('/api/reports/purchases/'),
      transformResponse: (res: { data: PurchaseReport }) => res.data,
      providesTags: ['Stock'],
    }),
    getSupplierReturnReport: build.query<PurchaseReport, ReportParams | void>({
      query: buildReportQuery('/api/reports/supplier-returns/'),
      transformResponse: (res: { data: PurchaseReport }) => res.data,
      providesTags: ['Stock'],
    }),
    getIncomeReport: build.query<LedgerReport, LedgerReportParams | void>({
      query: buildLedgerReportQuery('/api/reports/income/'),
      transformResponse: (res: { data: LedgerReport }) => res.data,
      providesTags: ['JournalEntries'],
    }),
    getExpenseReport: build.query<LedgerReport, LedgerReportParams | void>({
      query: buildLedgerReportQuery('/api/reports/expenses/'),
      transformResponse: (res: { data: LedgerReport }) => res.data,
      providesTags: ['JournalEntries'],
    }),
  }),
})

export const {
  useGetPurchaseReportQuery,
  useGetSupplierReturnReportQuery,
  useGetIncomeReportQuery,
  useGetExpenseReportQuery,
} = reportsApi

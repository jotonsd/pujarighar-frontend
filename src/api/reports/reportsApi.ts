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

export interface SalesReportRow {
  id: string
  date: string
  order_number: string
  customer_name: string
  phone: string
  payment_method: string
  payment_status: string
  status: string
  items_count: number
  subtotal: string
  discount_amount: string
  delivery_charge: string
  grand_total: string
}

export interface SalesReport {
  rows: SalesReportRow[]
  total_orders: number
  total_amount: string
}

export interface CartReportItem {
  product_name_bn: string
  product_name_en: string
  quantity: string
  unit_price: string
}

export interface CartReportRow {
  customer_id: string
  name_bn: string
  name_en: string
  phone: string
  email: string
  item_count: number
  total_quantity: string
  cart_value: string
  last_activity: string | null
  items: CartReportItem[]
}

export interface CartReport {
  rows: CartReportRow[]
  total_carts: number
  total_value: string
}

type ReportParams = { supplier_id?: string; product_id?: string; from?: string; to?: string; payment_method?: string }
type LedgerReportParams = { account_id?: string; from?: string; to?: string }
type SalesReportParams = { from?: string; to?: string; status?: string; payment_status?: string; payment_method?: string }
type CartReportParams = { search?: string }

function buildReportQuery(base: string) {
  return ({ supplier_id = '', product_id = '', from = '', to = '', payment_method = '' }: ReportParams = {}) => {
    const p = new URLSearchParams()
    if (supplier_id)    p.set('supplier_id', supplier_id)
    if (product_id)     p.set('product_id', product_id)
    if (from)            p.set('from', from)
    if (to)              p.set('to', to)
    if (payment_method) p.set('payment_method', payment_method)
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

function buildSalesReportQuery(base: string) {
  return ({ from = '', to = '', status = '', payment_status = '', payment_method = '' }: SalesReportParams = {}) => {
    const p = new URLSearchParams()
    if (from)           p.set('from', from)
    if (to)             p.set('to', to)
    if (status)         p.set('status', status)
    if (payment_status) p.set('payment_status', payment_status)
    if (payment_method) p.set('payment_method', payment_method)
    return `${base}?${p}`
  }
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getSalesReport: build.query<SalesReport, SalesReportParams | void>({
      query: buildSalesReportQuery('/api/reports/sales/'),
      transformResponse: (res: { data: SalesReport }) => res.data,
      providesTags: ['Orders'],
    }),
    getCartReport: build.query<CartReport, CartReportParams | void>({
      query: ({ search = '' }: CartReportParams = {}) => {
        const p = new URLSearchParams()
        if (search) p.set('search', search)
        return `/api/reports/carts/?${p}`
      },
      transformResponse: (res: { data: CartReport }) => res.data,
      providesTags: ['Cart'],
    }),
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
  useGetSalesReportQuery,
  useGetCartReportQuery,
  useGetPurchaseReportQuery,
  useGetSupplierReturnReportQuery,
  useGetIncomeReportQuery,
  useGetExpenseReportQuery,
} = reportsApi

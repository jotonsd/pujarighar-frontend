import { baseApi } from '@/api/baseApi'

export interface PurchaseReportRow {
  id: string
  date: string
  product_id: string
  product_name_bn: string
  product_name_en: string
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

export const reportsApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getPurchaseReport: build.query<PurchaseReport, { supplier_id?: string; product_id?: string; from?: string; to?: string }>({
      query: ({ supplier_id = '', product_id = '', from = '', to = '' } = {}) => {
        const p = new URLSearchParams()
        if (supplier_id) p.set('supplier_id', supplier_id)
        if (product_id)  p.set('product_id', product_id)
        if (from)        p.set('from', from)
        if (to)          p.set('to', to)
        return `/api/reports/purchases/?${p}`
      },
      transformResponse: (res: { data: PurchaseReport }) => res.data,
      providesTags: ['Stock'],
    }),
  }),
})

export const { useGetPurchaseReportQuery } = reportsApi

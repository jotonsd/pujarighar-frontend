import { baseApi } from '@/api/baseApi'
import { LoanInvestor, LoanPayment, LoanPaymentsData } from '@/lib/types'

export const loansApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getLoanInvestors: build.query<LoanInvestor[], void>({
      query: () => '/api/loans/',
      transformResponse: (res: { data: LoanInvestor[] }) => res.data,
      providesTags: ['Loans'],
    }),

    createLoanInvestor: build.mutation<LoanInvestor, Partial<LoanInvestor>>({
      query: (body) => ({ url: '/api/loans/create/', method: 'POST', body }),
      invalidatesTags: ['Loans'],
    }),

    updateLoanInvestor: build.mutation<LoanInvestor, { id: string } & Partial<LoanInvestor>>({
      query: ({ id, ...body }) => ({ url: `/api/loans/${id}/update/`, method: 'PATCH', body }),
      invalidatesTags: ['Loans'],
    }),

    deleteLoanInvestor: build.mutation<void, string>({
      query: (id) => ({ url: `/api/loans/${id}/delete/`, method: 'DELETE' }),
      invalidatesTags: ['Loans'],
    }),

    getLoanPayments: build.query<LoanPaymentsData, string>({
      query: (loanId) => `/api/loans/${loanId}/payments/`,
      transformResponse: (res: { data: LoanPaymentsData }) => res.data,
      providesTags: (_r, _e, loanId) => [{ type: 'Loans', id: `payments-${loanId}` }],
    }),

    createLoanPayment: build.mutation<LoanPayment, { loanId: string; payment_type: string; amount: string; paid_date: string; note?: string }>({
      query: ({ loanId, ...body }) => ({ url: `/api/loans/${loanId}/payments/create/`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { loanId }) => ['Loans', { type: 'Loans', id: `payments-${loanId}` }],
    }),

    deleteLoanPayment: build.mutation<void, { loanId: string; paymentId: string }>({
      query: ({ loanId, paymentId }) => ({ url: `/api/loans/${loanId}/payments/${paymentId}/delete/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { loanId }) => ['Loans', { type: 'Loans', id: `payments-${loanId}` }],
    }),

  }),
  overrideExisting: false,
})

export const {
  useGetLoanInvestorsQuery,
  useCreateLoanInvestorMutation,
  useUpdateLoanInvestorMutation,
  useDeleteLoanInvestorMutation,
  useGetLoanPaymentsQuery,
  useCreateLoanPaymentMutation,
  useDeleteLoanPaymentMutation,
} = loansApi

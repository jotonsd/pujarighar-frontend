import { baseApi } from '@/api/baseApi'

export type InvoicePageSize = 'A4' | 'A5' | 'LETTER' | 'THERMAL'

export interface SiteSettings {
  invoice_page_size:   InvoicePageSize
  company_name_bn:     string
  company_name_en:     string
  contact_phone:       string
  contact_email:       string
  address_bn:          string
  address_en:          string
  logo:                string | null
  favicon:             string | null
  email_host:          string
  email_port:          number
  email_host_user:     string
  email_host_password: string
  email_use_tls:       boolean
  email_default_from:  string
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getSiteSettings: build.query<SiteSettings, void>({
      query: () => '/api/settings/',
      transformResponse: (res: { data: SiteSettings }) => res.data,
      providesTags: ['SiteSettings'],
    }),
    updateSiteSettings: build.mutation<SiteSettings, FormData | Partial<SiteSettings>>({
      query: body => ({ url: '/api/settings/update/', method: 'PATCH', body }),
      transformResponse: (res: { data: SiteSettings }) => res.data,
      invalidatesTags: ['SiteSettings'],
    }),
  }),
})

export const { useGetSiteSettingsQuery, useUpdateSiteSettingsMutation } = settingsApi

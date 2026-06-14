import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

export const locales = ['bn', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'bn'

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) as Locale
  if (!locales.includes(locale)) notFound()

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})

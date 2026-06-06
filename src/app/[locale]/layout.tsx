import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/lib/i18n'
import Providers from '@/components/layout/Providers'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Toaster from '@/components/ui/Toaster'
import type { Metadata } from 'next'
import { Ubuntu } from 'next/font/google'

const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'পূজারিঘর | PujariGhar',
  icons: { icon: '/assets/logo/favicon.png' },
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale as 'bn' | 'en')) notFound()

  const messages = await getMessages()

  return (
    <html lang={locale} className={locale === 'en' ? ubuntu.className : ''}>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster />
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

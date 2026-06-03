import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from '@/lib/i18n'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: false,
})

const ADMIN_PATHS     = ['/admin']
const DELIVERY_PATHS  = ['/delivery']
const AUTH_PATHS      = ['/auth/login', '/auth/register']
const PROTECTED_PATHS = ['/profile', '/orders']

function extractLocale(pathname: string): string {
  const segment = pathname.split('/')[1]
  return locales.includes(segment as 'bn' | 'en') ? segment : defaultLocale
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const locale = extractLocale(pathname)

  // Strip locale prefix to get the route
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'

  const accessToken = request.cookies.get('access_token')?.value
  const userRaw     = request.cookies.get('user')?.value
  const role        = userRaw ? JSON.parse(userRaw).role : null

  // Redirect authenticated users away from auth pages
  if (AUTH_PATHS.some((p) => pathWithoutLocale.startsWith(p)) && accessToken) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url))
  }

  // Protect customer routes
  if (PROTECTED_PATHS.some((p) => pathWithoutLocale.startsWith(p)) && !accessToken) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
  }

  // Protect admin routes
  if (ADMIN_PATHS.some((p) => pathWithoutLocale.startsWith(p))) {
    if (!accessToken) {
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
    }
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/${locale}`, request.url))
    }
  }

  // Protect delivery routes
  if (DELIVERY_PATHS.some((p) => pathWithoutLocale.startsWith(p))) {
    if (!accessToken) {
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
    }
    if (role !== 'DELIVERY') {
      return NextResponse.redirect(new URL(`/${locale}`, request.url))
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

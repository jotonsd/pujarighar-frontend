import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from '@/lib/i18n'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: false,
})

const ADMIN_PATHS       = ['/admin']
const DELIVERY_PATHS    = ['/delivery']
const AUTH_PATHS        = ['/auth/login', '/auth/register']
const PROTECTED_PATHS   = ['/profile', '/orders', '/notifications']
const MAINTENANCE_PATHS = ['/maintenance', '/auth/login']

// Cached in-process (single Node server) so we don't hit the backend on every request.
const MAINTENANCE_CACHE_TTL_MS = 10_000
let maintenanceCache = { value: false, expiresAt: 0 }

async function isMaintenanceMode(): Promise<boolean> {
  const now = Date.now()
  if (now < maintenanceCache.expiresAt) return maintenanceCache.value

  let value = false
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/site-settings/`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    })
    value = res.status === 503
  } catch {
    // Backend unreachable — fail open so a network blip doesn't take down the whole site
    value = false
  }
  maintenanceCache = { value, expiresAt: now + MAINTENANCE_CACHE_TTL_MS }
  return value
}

function extractLocale(pathname: string): string {
  const segment = pathname.split('/')[1]
  return locales.includes(segment as 'bn' | 'en') ? segment : defaultLocale
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const locale = extractLocale(pathname)

  // Strip locale prefix to get the route
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'

  const accessToken = request.cookies.get('access_token')?.value
  const userRaw     = request.cookies.get('user')?.value
  const role        = userRaw ? JSON.parse(userRaw).role : null

  // Show maintenance page to everyone except admins (mirrors backend bypass) and login/maintenance routes
  if (
    role !== 'ADMIN' &&
    !MAINTENANCE_PATHS.some((p) => pathWithoutLocale.startsWith(p)) &&
    (await isMaintenanceMode())
  ) {
    return NextResponse.redirect(new URL(`/${locale}/maintenance`, request.url))
  }

  // Send admins straight to the POS page from the homepage
  if (pathWithoutLocale === '/' && role === 'ADMIN') {
    return NextResponse.redirect(new URL(`/${locale}/admin/orders/new`, request.url))
  }

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
    if (role !== 'ADMIN' && role !== 'WAREHOUSE') {
      return NextResponse.redirect(new URL(`/${locale}/403`, request.url))
    }
  }

  // Protect delivery routes
  if (DELIVERY_PATHS.some((p) => pathWithoutLocale.startsWith(p))) {
    if (!accessToken) {
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
    }
    if (role !== 'DELIVERY') {
      return NextResponse.redirect(new URL(`/${locale}/403`, request.url))
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

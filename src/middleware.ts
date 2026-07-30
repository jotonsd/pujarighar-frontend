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

  // Canonicalize www -> non-www (avoids duplicate-content / CORS mismatches across hostnames).
  // Read the raw Host header, not request.nextUrl.hostname — the latter doesn't reliably
  // reflect the incoming Host header behind a proxy.
  const hostHeader = request.headers.get('host') ?? ''
  if (hostHeader.startsWith('www.')) {
    const url = request.nextUrl.clone()
    url.hostname = hostHeader.replace(/^www\./, '').split(':')[0]
    // Behind the reverse proxy, request.nextUrl carries the internal PM2 port (e.g. :3003) —
    // clearing it prevents redirecting the browser to an unreachable internal port.
    url.port = ''
    return NextResponse.redirect(url, 308)
  }

  const locale = extractLocale(pathname)

  // Strip locale prefix to get the route
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'

  // `access_token` is short-lived (1hr) and silently refreshed client-side via
  // `refresh_token` on 401 — so it's not a reliable "is logged in" signal here.
  // `refresh_token` (and `user`) live for the full session (3-30 days), so use that.
  const isLoggedIn = !!request.cookies.get('refresh_token')?.value
  const userRaw    = request.cookies.get('user')?.value
  const userObj    = userRaw ? JSON.parse(userRaw) : null
  // `role` here is the role's `code` — null for both "not logged in" and "a
  // custom (non-system) admin-staff role" (only ADMIN/WAREHOUSE/DELIVERY/
  // CUSTOMER have a fixed code). Used only for the maintenance/POS-redirect
  // shortcuts and the delivery-portal gate below — the admin-path gate no
  // longer makes its allow/deny decision from this cookie snapshot (see
  // comment further down).
  const role = userObj?.role?.code ?? null
  // Any logged-in, non-customer, non-delivery user (ADMIN, WAREHOUSE, or a
  // custom admin-staff role — the latter has a null code, same as a guest,
  // which is why this also checks `userObj` is actually present).
  const isStaff = !!userObj && role !== 'CUSTOMER' && role !== 'DELIVERY'

  // Show maintenance page to everyone except admins (mirrors backend bypass) and login/maintenance routes
  if (
    role !== 'ADMIN' &&
    !MAINTENANCE_PATHS.some((p) => pathWithoutLocale.startsWith(p)) &&
    (await isMaintenanceMode())
  ) {
    return NextResponse.redirect(new URL(`/${locale}/maintenance`, request.url))
  }

  // Staff-type users (admin-staff of any kind) never see the public storefront
  // homepage — send them straight to the POS page instead.
  if (pathWithoutLocale === '/' && isStaff) {
    return NextResponse.redirect(new URL(`/${locale}/admin/orders/new`, request.url))
  }

  // Redirecting authenticated users away from /auth/login is handled
  // client-side on the login page itself (via a real useGetMeQuery() call),
  // not here — this middleware only sees whether a refresh_token cookie
  // EXISTS, not whether it's still valid, and a stale-but-present cookie
  // would otherwise trap a user who genuinely needs to log in again.

  // Protect customer routes
  if (PROTECTED_PATHS.some((p) => pathWithoutLocale.startsWith(p)) && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
  }

  // Protect admin routes — only checks isLoggedIn here. The CUSTOMER/DELIVERY
  // exclusion used to also be decided here from the `user` cookie, but that
  // cookie is only as fresh as the last client-side getMe() call, and a
  // request landing here can easily use a snapshot from *before* a role was
  // granted/changed — producing a false 403 that "shouldn't" happen. That
  // finer check now lives in the admin layout itself (AdminLayout.tsx),
  // which asks the backend directly with live data instead of trusting a
  // potentially-stale cookie snapshot.
  if (ADMIN_PATHS.some((p) => pathWithoutLocale.startsWith(p)) && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
  }

  // Protect delivery routes
  if (DELIVERY_PATHS.some((p) => pathWithoutLocale.startsWith(p))) {
    if (!isLoggedIn) {
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

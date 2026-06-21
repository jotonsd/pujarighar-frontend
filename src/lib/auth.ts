import Cookies from 'js-cookie'
import { User, AuthTokens } from './types'

export function saveTokens(tokens: AuthTokens, rememberMe = false) {
  const days = rememberMe ? 30 : 3
  Cookies.set('access_token',  tokens.access,  { expires: 1 / 24, sameSite: 'lax' })
  Cookies.set('refresh_token', tokens.refresh, { expires: days,   sameSite: 'lax' })
}

export function clearTokens() {
  Cookies.remove('access_token')
  Cookies.remove('refresh_token')
  Cookies.remove('user')
}

export function saveUser(user: User, rememberMe = false) {
  const days = rememberMe ? 30 : 3
  Cookies.set('user', JSON.stringify(user), { expires: days, sameSite: 'lax' })
}

export function getUser(): User | null {
  try {
    const raw = Cookies.get('user')
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return !!Cookies.get('access_token')
}

export function getLocale(): string {
  return Cookies.get('locale') ?? 'bn'
}

export function setLocale(locale: string) {
  Cookies.set('locale', locale, { expires: 365, sameSite: 'lax' })
}

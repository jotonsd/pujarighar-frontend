import Cookies from 'js-cookie'

// Anonymous per-browser identity so guests (no login) still get personalized
// product recommendations, same as logged-in users.
export function getGuestId(): string {
  if (typeof window === 'undefined') return ''
  let id = Cookies.get('guest_id')
  if (!id) {
    id = crypto.randomUUID()
    Cookies.set('guest_id', id, { expires: 365, sameSite: 'lax' })
  }
  return id
}

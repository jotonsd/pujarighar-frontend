import { create } from 'zustand'
import { User } from '@/lib/types'
import { saveTokens, clearTokens, saveUser, getUser } from '@/lib/auth'
import { store } from '@/store/store'
import { baseApi } from '@/api/baseApi'

// setAuth()/logout() both need to drop RTK Query's cached data (getMe, cart,
// notifications, etc.) — otherwise a login shows stale pre-login (guest) data
// until a full reload, and a logout keeps showing the previous user's data
// until something happens to trigger a refetch. resetApiState() clears
// everything synchronously rather than just kicking off a background refetch
// that would leave the stale value visible in the meantime.
function resetApiCache() {
  store.dispatch(baseApi.util.resetApiState())
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  hydrated: boolean
  setAuth: (user: User, access: string, refresh: string, rememberMe?: boolean) => void
  updateUser: (user: User) => void
  logout: () => void
  hydrate: () => void
}

// Initial state intentionally matches what the server renders (it can't read
// cookies) — `hydrate()` is called from a useEffect in Providers.tsx, i.e.
// after the first client render, so the real auth state is applied as a
// follow-up update rather than baked into the first render. Reading cookies
// synchronously here instead would make the client's first render diverge
// from the server's and trigger a React hydration error.
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  hydrated: false,

  setAuth(user, access, refresh, rememberMe = false) {
    saveTokens({ access, refresh }, rememberMe)
    saveUser(user, rememberMe)
    resetApiCache()
    set({ user, isAuthenticated: true, hydrated: true })
  },

  updateUser(user) {
    saveUser(user)
    // A valid User object is itself proof of an authenticated session — this
    // is also called from contexts (e.g. the login page's own-session check)
    // that never went through setAuth(), so isAuthenticated must be set here
    // too, not just assumed already true.
    set({ user, isAuthenticated: true })
  },

  logout() {
    // No-op if already logged out — resetApiCache() re-triggers a refetch of
    // any actively-subscribed query (e.g. the Navbar's getMe), which 401s
    // when there's no session and re-fires the "on 401, logout()" effect
    // elsewhere. Without this guard that becomes an infinite loop: logout →
    // reset → refetch → 401 → logout → reset → refetch → ...
    if (!get().isAuthenticated) return
    clearTokens()
    resetApiCache()
    set({ user: null, isAuthenticated: false })
  },

  hydrate() {
    const user = getUser()
    set({ user, isAuthenticated: !!user, hydrated: true })
  },
}))

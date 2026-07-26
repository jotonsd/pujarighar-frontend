import { create } from 'zustand'
import { User } from '@/lib/types'
import { saveTokens, clearTokens, saveUser, getUser } from '@/lib/auth'

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
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  hydrated: false,

  setAuth(user, access, refresh, rememberMe = false) {
    saveTokens({ access, refresh }, rememberMe)
    saveUser(user, rememberMe)
    set({ user, isAuthenticated: true, hydrated: true })
  },

  updateUser(user) {
    saveUser(user)
    set({ user })
  },

  logout() {
    clearTokens()
    set({ user: null, isAuthenticated: false })
  },

  hydrate() {
    const user = getUser()
    set({ user, isAuthenticated: !!user, hydrated: true })
  },
}))

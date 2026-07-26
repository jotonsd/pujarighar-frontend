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

// Read synchronously at module load (guarded for SSR, where there's no
// `document`) so the store's *initial* state is already correct by the time
// the first client render happens — this is what actually avoids the old
// "flash logged-out, then flip a moment later" behavior. The `hydrate()`
// action below still exists for Providers.tsx to call, but is now just a
// harmless re-sync rather than the sole source of truth.
const initialUser = typeof document !== 'undefined' ? getUser() : null

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  hydrated: typeof document !== 'undefined',

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

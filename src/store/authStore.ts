import { create } from 'zustand'
import { User } from '@/lib/types'
import { saveTokens, clearTokens, saveUser, getUser } from '@/lib/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setAuth: (user: User, access: string, refresh: string, rememberMe?: boolean) => void
  updateUser: (user: User) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setAuth(user, access, refresh, rememberMe = false) {
    saveTokens({ access, refresh }, rememberMe)
    saveUser(user, rememberMe)
    set({ user, isAuthenticated: true })
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
    if (user) set({ user, isAuthenticated: true })
  },
}))

import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastState {
  toasts: Toast[]
  show: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  show(message, type = 'info') {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3500)
  },

  success(message) { this.show(message, 'success') },
  error(message)   { this.show(message, 'error') },
  info(message)    { this.show(message, 'info') },

  remove(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

export const toast = {
  success: (msg: string) => useToastStore.getState().success(msg),
  error:   (msg: string) => useToastStore.getState().error(msg),
  info:    (msg: string) => useToastStore.getState().info(msg),
  show:    (msg: string, type?: ToastType) => useToastStore.getState().show(msg, type),
}

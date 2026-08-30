import { create } from 'zustand'

interface SupportChatState {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useSupportChatStore = create<SupportChatState>((set) => ({
  isOpen: false,
  open()   { set({ isOpen: true }) },
  close()  { set({ isOpen: false }) },
  toggle() { set((s) => ({ isOpen: !s.isOpen })) },
}))

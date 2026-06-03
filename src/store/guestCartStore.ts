import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GuestCartPackageItem {
  component_name_bn: string
  component_name_en: string
  quantity: string
}

export interface GuestCartItem {
  product_id:    string
  name_bn:       string
  name_en:       string
  unit_price:    string
  quantity:      number
  stock:         number
  is_package:    boolean
  package_items: GuestCartPackageItem[]
}

interface GuestCartState {
  items: GuestCartItem[]
  addItem:    (item: Omit<GuestCartItem, 'quantity'>, qty?: number) => void
  updateQty:  (product_id: string, quantity: number) => void
  removeItem: (product_id: string) => void
  clear:      () => void
  totalItems: () => number
  subtotal:   () => number
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(item, qty = 1) {
        set((s) => {
          const existing = s.items.find((i) => i.product_id === item.product_id)
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.product_id === item.product_id
                  ? { ...i, quantity: Math.min(i.quantity + qty, i.stock) }
                  : i,
              ),
            }
          }
          return { items: [...s.items, { ...item, quantity: Math.min(qty, item.stock) }] }
        })
      },

      updateQty(product_id, quantity) {
        if (quantity <= 0) {
          get().removeItem(product_id)
          return
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.product_id === product_id ? { ...i, quantity } : i,
          ),
        }))
      },

      removeItem(product_id) {
        set((s) => ({ items: s.items.filter((i) => i.product_id !== product_id) }))
      },

      clear() { set({ items: [] }) },

      totalItems() { return get().items.reduce((sum, i) => sum + i.quantity, 0) },

      subtotal() {
        return get().items.reduce(
          (sum, i) => sum + parseFloat(i.unit_price) * i.quantity, 0,
        )
      },
    }),
    { name: 'pujarighar-guest-cart' },
  ),
)

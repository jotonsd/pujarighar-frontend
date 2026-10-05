import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GuestCartPackageItem {
  component_name_bn: string
  component_name_en: string
  quantity: string
}

export interface GuestCartItem {
  product_id:          string
  name_bn:             string
  name_en:             string
  unit_price:          string   // effective (discounted) price
  original_unit_price: string   // original price before discount
  quantity:            number
  stock:               number
  is_package:          boolean
  package_items:       GuestCartPackageItem[]
  image?:              string
  weight_kg?:          string | null
  color_bn?:           string
  color_en?:           string
}

interface GuestCartState {
  items:          GuestCartItem[]
  addItem:        (item: Omit<GuestCartItem, 'quantity'>, qty?: number) => void
  updateQty:      (product_id: string, quantity: number, colorBn?: string, colorEn?: string) => void
  removeItem:     (product_id: string, colorBn?: string, colorEn?: string) => void
  clear:          () => void
  totalItems:     () => number
  subtotal:       () => number
  discountAmount: () => number
}

const sameColor = (a: GuestCartItem, bBn?: string, bEn?: string) =>
  (a.color_bn ?? '') === (bBn ?? '') && (a.color_en ?? '') === (bEn ?? '')

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(item, qty = 1) {
        set((s) => {
          const existing = s.items.find((i) => i.product_id === item.product_id && sameColor(i, item.color_bn, item.color_en))
          if (existing) {
            return {
              items: s.items.map((i) =>
                i === existing
                  ? { ...i, quantity: Math.min(i.quantity + qty, i.stock) }
                  : i,
              ),
            }
          }
          return { items: [...s.items, { ...item, quantity: Math.min(qty, item.stock) }] }
        })
      },

      updateQty(product_id, quantity, colorBn = '', colorEn = '') {
        if (quantity <= 0) {
          get().removeItem(product_id, colorBn, colorEn)
          return
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.product_id === product_id && sameColor(i, colorBn, colorEn) ? { ...i, quantity } : i,
          ),
        }))
      },

      removeItem(product_id, colorBn = '', colorEn = '') {
        set((s) => ({ items: s.items.filter((i) => !(i.product_id === product_id && sameColor(i, colorBn, colorEn))) }))
      },

      clear() { set({ items: [] }) },

      totalItems() { return get().items.reduce((sum, i) => sum + i.quantity, 0) },

      subtotal() {
        return get().items.reduce(
          (sum, i) => sum + parseFloat(i.unit_price) * i.quantity, 0,
        )
      },

      discountAmount() {
        return get().items.reduce((sum, i) => {
          const orig = parseFloat(i.original_unit_price)
          const eff  = parseFloat(i.unit_price)
          return sum + Math.max(orig - eff, 0) * i.quantity
        }, 0)
      },
    }),
    { name: 'pujarighar-guest-cart' },
  ),
)

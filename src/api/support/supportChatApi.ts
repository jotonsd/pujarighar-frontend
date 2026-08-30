import { baseApi } from '@/api/baseApi'

export interface SupportChatTurn {
  role: 'user' | 'model'
  text: string
}

interface SupportChatRequest {
  message: string
  history: SupportChatTurn[]
}

export interface SupportChatProduct {
  name_bn: string
  name_en: string
  price: string
  original_price: string | null
  discount_percent: string | null
  in_stock: boolean
  url: string | null
  image_url: string | null
}

export interface PendingOrderItem {
  name_bn: string
  name_en: string
  quantity: number
  unit_price: string
  line_total: string
  in_stock: boolean
  image_url: string | null
}

export interface PendingOrder {
  items: PendingOrderItem[]
  subtotal: string
  delivery_charge: string
  grand_total: string
  payment_method: string
}

interface SupportChatResult {
  reply: string
  products: SupportChatProduct[]
  pending_order: PendingOrder | null
}

export const supportChatApi = baseApi.injectEndpoints({
  endpoints: build => ({
    sendSupportChat: build.mutation<SupportChatResult, SupportChatRequest>({
      query: body => ({ url: '/api/support/chat/', method: 'POST', body }),
      transformResponse: (res: { data: SupportChatResult }) => res.data,
    }),
  }),
})

export const { useSendSupportChatMutation } = supportChatApi

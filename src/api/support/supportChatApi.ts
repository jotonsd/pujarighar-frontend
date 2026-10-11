import { baseApi } from '@/api/baseApi'

export interface SupportChatTurn {
  role: 'user' | 'model'
  text: string
}

interface SupportChatRequest {
  message: string
  history: SupportChatTurn[]
  pending_order?: PendingOrder | null
}

export interface SupportChatProduct {
  product_id: string
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
  product_id: string
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
  customer_name: string | null
  phone: string | null
  address: string | null
  district: string | null
}

export interface DisambiguationCandidate {
  product_id: string
  name_bn: string
  name_en: string
  price: string
  image_url: string | null
}

interface SupportChatResult {
  reply: string
  products: SupportChatProduct[]
  pending_order: PendingOrder | null
  candidates: DisambiguationCandidate[]
  order_updated: boolean
}

interface AddSupportChatItemsRequest {
  product_ids: string[]
  pending_order?: PendingOrder | null
}

export const supportChatApi = baseApi.injectEndpoints({
  endpoints: build => ({
    sendSupportChat: build.mutation<SupportChatResult, SupportChatRequest>({
      query: body => ({ url: '/api/support/chat/', method: 'POST', body }),
      transformResponse: (res: { data: SupportChatResult }) => res.data,
    }),

    // Checkbox multi-select "Order selected" — deterministic, no AI call
    // (see backend support_chat_service.add_order_items_by_id): the
    // product_ids already came straight from a real search result the
    // customer ticked, so there's nothing for a model to resolve or guess.
    addSupportChatItems: build.mutation<PendingOrder, AddSupportChatItemsRequest>({
      query: body => ({ url: '/api/support/chat/add-items/', method: 'POST', body }),
      transformResponse: (res: { data: PendingOrder }) => res.data,
    }),
  }),
})

export const { useSendSupportChatMutation, useAddSupportChatItemsMutation } = supportChatApi

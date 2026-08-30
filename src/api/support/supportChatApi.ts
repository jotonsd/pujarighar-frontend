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

interface SupportChatResult {
  reply: string
  products: SupportChatProduct[]
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

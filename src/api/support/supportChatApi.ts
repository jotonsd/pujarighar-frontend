import { baseApi } from '@/api/baseApi'

export interface SupportChatTurn {
  role: 'user' | 'model'
  text: string
}

interface SupportChatRequest {
  message: string
  history: SupportChatTurn[]
}

interface SupportChatResult {
  reply: string
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

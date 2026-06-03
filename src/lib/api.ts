import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT + Accept-Language on every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token  = Cookies.get('access_token')
  const locale = Cookies.get('locale') ?? 'bn'

  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['Accept-Language'] = locale

  return config
})

// Refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = Cookies.get('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, { refresh })
          Cookies.set('access_token', data.access, { expires: 1 / 24 })
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
          if (typeof window !== 'undefined') {
            const locale = Cookies.get('locale') ?? 'bn'
            window.location.href = `/${locale}/auth/login`
          }
        }
      }
    }

    return Promise.reject(error)
  },
)

export default api

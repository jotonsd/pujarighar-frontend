'use client'

import { useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { store } from '@/store/store'
import { useAuthStore } from '@/store/authStore'

function AuthHydrator() {
  const hydrate  = useAuthStore((s) => s.hydrate)
  const hydrated = useRef(false)
  useEffect(() => {
    if (!hydrated.current) {
      hydrate()
      hydrated.current = true
    }
  }, [hydrate])
  return null
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''}>
      <Provider store={store}>
        <AuthHydrator />
        {children}
      </Provider>
    </GoogleOAuthProvider>
  )
}

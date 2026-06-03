'use client'

import { useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
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
    <Provider store={store}>
      <AuthHydrator />
      {children}
    </Provider>
  )
}

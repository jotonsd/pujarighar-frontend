import { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

export default function DeliveryLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>
}

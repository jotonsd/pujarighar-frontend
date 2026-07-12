import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'পূজারিঘর | PujariGhar',
  description: 'Religious & Puja (Pooja) goods e-commerce platform — your trusted pooja ghar',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'পূজারিঘর | PujariGhar',
  description: 'Religious & Puja goods e-commerce platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}

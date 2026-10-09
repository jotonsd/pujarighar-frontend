'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, SunMoon } from 'lucide-react'

// Cycles light → dark → system (auto), rather than a plain light/dark
// toggle — `theme` (not `resolvedTheme`) drives the icon so "system" has
// its own distinct state instead of collapsing into whatever it resolves to.
const NEXT: Record<string, string> = { light: 'dark', dark: 'system', system: 'light' }

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  // theme is undefined until next-themes reads localStorage on the client —
  // rendering a neutral placeholder until then avoids an icon flash
  // mismatching the server-rendered markup.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const current = mounted ? (theme ?? 'system') : undefined
  const titles: Record<string, string> = {
    light: 'Light mode (click for dark)',
    dark: 'Dark mode (click for system)',
    system: 'System mode (click for light)',
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[current ?? 'system'])}
      title={current ? titles[current] : 'Toggle theme'}
      aria-label="Toggle theme"
      className={`inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-surface-alt border border-border hover:bg-border transition-colors ${className}`}
    >
      {current === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
      {current === 'dark' && <Moon className="w-4 h-4 text-muted" />}
      {current === 'system' && <SunMoon className="w-4 h-4 text-muted" />}
    </button>
  )
}

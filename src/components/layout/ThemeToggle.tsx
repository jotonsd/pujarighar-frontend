'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // resolvedTheme is undefined until next-themes reads localStorage on the
  // client — rendering a neutral placeholder until then avoids a
  // light/dark icon flash mismatching the server-rendered markup.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title="Toggle dark mode"
      aria-label="Toggle dark mode"
      className="inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-surface-alt border border-border hover:bg-border transition-colors"
    >
      {mounted && (isDark
        ? <Sun className="w-4 h-4 text-amber-500" />
        : <Moon className="w-4 h-4 text-gray-600" />)}
    </button>
  )
}

'use client'

import { ReactNode } from 'react'

type Variant = 'amber' | 'red'

const variants: Record<Variant, { active: string; input: string; ring: string }> = {
  amber: {
    active: 'bg-amber-50 text-amber-700',
    input:  'text-amber-500',
    ring:   'focus:ring-amber-400',
  },
  red: {
    active: 'bg-red-50 text-red-600',
    input:  'text-red-500',
    ring:   'focus:ring-red-400',
  },
}

interface CheckboxProps {
  checked: boolean
  onChange: () => void
  label: ReactNode
  variant?: Variant
  bold?: boolean
  className?: string
}

export default function Checkbox({
  checked,
  onChange,
  label,
  variant = 'amber',
  bold = false,
  className = '',
}: CheckboxProps) {
  const v = variants[variant]

  return (
    <label
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
        checked ? v.active : 'text-gray-600 hover:bg-gray-50'
      } ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={`w-4 h-4 rounded border-gray-300 shrink-0 cursor-pointer ${v.input} ${v.ring}`}
      />
      <span className={`leading-snug ${bold ? 'font-medium' : ''}`}>{label}</span>
    </label>
  )
}

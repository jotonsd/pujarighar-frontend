import { clsx } from 'clsx'

type Variant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'orange' | 'purple'

const variants: Record<Variant, string> = {
  green:  'bg-green-100 text-green-700',
  red:    'bg-amber-100 text-amber-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue:   'bg-blue-100 text-blue-700',
  gray:   'bg-gray-100 text-gray-600',
  orange: 'bg-orange-100 text-orange-700',
  purple: 'bg-purple-100 text-purple-700',
}

export default function Badge({
  children,
  variant = 'gray',
  className,
}: {
  children: React.ReactNode
  variant?: Variant
  className?: string
}) {
  return (
    <span className={clsx('badge', variants[variant], className)}>
      {children}
    </span>
  )
}

import { clsx } from 'clsx'

export default function Spinner({ className }: { className?: string }) {
  return (
    <div className={clsx('flex justify-center items-center py-12', className)}>
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

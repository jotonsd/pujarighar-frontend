'use client'

import { useToastStore, type ToastType } from '@/store/toastStore'
import { clsx } from 'clsx'

const styles: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error:   'bg-red-600 text-white',
  info:    'bg-blue-600 text-white',
  warning: 'bg-amber-500 text-white',
}

const icons: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
}

export default function Toaster() {
  const { toasts, remove } = useToastStore()

  if (!toasts.length) return null

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col-reverse gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg',
            'animate-in slide-in-from-top-2 duration-200',
            styles[toast.type],
          )}
        >
          <span className="text-lg leading-none mt-0.5">{icons[toast.type]}</span>
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => remove(toast.id)}
            className="text-white/70 hover:text-white text-lg leading-none ml-1"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

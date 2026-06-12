'use client'

import { ReactNode } from 'react'

export default function ConfirmModal({
  icon = '⚠️',
  title,
  description,
  confirmLabel,
  cancelLabel = 'বাতিল / Cancel',
  confirmClassName = 'flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm',
  loading = false,
  onConfirm,
  onCancel,
}: {
  icon?: ReactNode
  title: string
  description?: string
  confirmLabel: string
  cancelLabel?: string
  confirmClassName?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        </div>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={confirmClassName}
          >
            {loading ? '...' : confirmLabel}
          </button>
          <button onClick={onCancel} disabled={loading} className="flex-1 btn-secondary">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

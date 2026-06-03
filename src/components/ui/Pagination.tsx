'use client'

import { useTranslations } from 'next-intl'

interface Props {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-50"
      >
        ‹
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1 rounded border text-sm ${
            p === page ? 'bg-amber-500 text-white border-amber-500' : 'hover:bg-gray-50'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-50"
      >
        ›
      </button>
    </div>
  )
}

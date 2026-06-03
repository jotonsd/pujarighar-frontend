'use client'

import { Skeleton } from './Skeleton'

interface TableSkeletonProps {
  columns?: number
  rows?: number
}

export default function TableSkeleton({ columns = 5, rows = 10 }: TableSkeletonProps) {
  const widths = ['w-16', 'w-32', 'w-24', 'w-28', 'w-20', 'w-12']

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-amber-50 border-b border-amber-200">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: columns }).map((_, c) => (
                  <td key={c} className="px-4 py-3.5">
                    <Skeleton className={`h-3.5 ${widths[c % widths.length]}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

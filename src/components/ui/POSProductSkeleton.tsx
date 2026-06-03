'use client'

import { Skeleton } from './Skeleton'

export default function POSProductSkeleton({ count = 25 }: { count?: number }) {
  return (
    <div className="overflow-y-auto flex-1 grid grid-cols-5 gap-3 content-start">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-white p-2 space-y-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

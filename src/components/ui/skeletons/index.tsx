"use client";

import { Skeleton } from "@/components/ui/Skeleton";

// ─── Product Card ─────────────────────────────────────────────────────────────

export function ProductCardSkeleton() {
  return (
    <div className="card p-0 overflow-hidden flex flex-col">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

// ─── Package Card ─────────────────────────────────────────────────────────────

export function PackageCardSkeleton() {
  return (
    <div className="card p-0 overflow-hidden flex flex-col">
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

// ─── Filter Panel (products page left sidebar) ────────────────────────────────

export function FilterPanelSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Skeleton className="h-2.5 w-14 rounded" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      {/* Sort By */}
      <div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      {/* Price Range */}
      <div className="space-y-3">
        <Skeleton className="h-2.5 w-24 rounded" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-10 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
      </div>
      {/* Category */}
      <div className="space-y-1">
        <Skeleton className="h-2.5 w-20 rounded mb-3" />
        {(["w-3/5", "w-4/5", "w-2/5", "w-full", "w-3/4", "w-1/2"] as const).map(
          (w, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2">
              <Skeleton className="w-4 h-4 rounded shrink-0" />
              <Skeleton className={`h-3.5 rounded ${w}`} />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

// ─── Product Detail ───────────────────────────────────────────────────────────

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <Skeleton className="h-4 w-20 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} className="w-16 h-16 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <div className="flex gap-3 mt-6">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Order Detail ───────────────────────────────────────────────────────

export function OrderDetailSkeleton() {
  return (
    <div className="max-w-7xl space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Admin User Detail ────────────────────────────────────────────────────────

export function UserDetailSkeleton() {
  return (
    <div className="max-w-7xl space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Delivery Order Detail ────────────────────────────────────────────────────

export function DeliveryOrderDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <Skeleton className="h-4 w-20 mb-6" />
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="flex gap-3 mb-3">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 flex-1 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );
}

// ─── POS Product Grid ─────────────────────────────────────────────────────────

export function POSProductSkeleton({ count = 25 }: { count?: number }) {
  return (
    <div className="overflow-y-auto flex-1 grid grid-cols-5 gap-3 content-start">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-100 bg-white p-2 space-y-2"
        >
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

export default function TableSkeleton({
  columns = 5,
  rows = 10,
}: {
  columns?: number;
  rows?: number;
}) {
  const widths = ["w-16", "w-32", "w-24", "w-28", "w-20", "w-12"];
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
                    <Skeleton
                      className={`h-3.5 ${widths[c % widths.length]}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

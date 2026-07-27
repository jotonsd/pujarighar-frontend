"use client";

import { useGetCourierReturnRequestsQuery } from "@/api/courier/courierApi";
import TableSkeleton from "@/components/ui/skeletons";
import { useState } from "react";

export default function ReturnsTab({ isBn }: { isBn: boolean }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetCourierReturnRequestsQuery({ page });
  const rows = data?.data ?? [];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(isBn ? "bn-BD" : "en-US", { day: "numeric", month: "short", year: "numeric" });

  if (isLoading) return <TableSkeleton columns={5} rows={6} />;
  if (rows.length === 0) return <p className="text-sm text-gray-400">{isBn ? "কোনো ফেরত অনুরোধ নেই" : "No return requests yet"}</p>;

  return (
    <div className="card p-0 overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-amber-50 border-b border-amber-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "অর্ডার" : "Order"}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "ট্র্যাকিং কোড" : "Tracking Code"}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "কারণ" : "Reason"}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "স্ট্যাটাস" : "Status"}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "তারিখ" : "Date"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(r => (
            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-700 font-medium">{r.order_number}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.tracking_code || "—"}</td>
              <td className="px-4 py-3 text-xs text-gray-600">{r.reason || "—"}</td>
              <td className="px-4 py-3"><span className="badge bg-gray-100 text-gray-700">{r.status}</span></td>
              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(r.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {data && data.pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-100">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40">
            {isBn ? "আগে" : "Prev"}
          </button>
          <span className="text-xs text-gray-500">{page} / {data.pagination.total_pages}</span>
          <button onClick={() => setPage(p => Math.min(data.pagination.total_pages, p + 1))} disabled={page >= data.pagination.total_pages} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40">
            {isBn ? "পরে" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}

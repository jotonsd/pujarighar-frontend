"use client";

import { useGetCourierPaymentsQuery, useGetCourierProvidersQuery } from "@/api/courier/courierApi";

// Steadfast's /payments response shape isn't fully documented, so this renders
// whatever comes back generically (columns derived from the first row's keys)
// instead of assuming a fixed structure.
function normalizeRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: Record<string, unknown>[] }).data;
  }
  return [];
}

export default function PaymentsTab({ isBn }: { isBn: boolean }) {
  const { data: providers = [] } = useGetCourierProvidersQuery();
  const activeProvider = providers.find(p => p.is_active);
  const { data, isLoading, isError } = useGetCourierPaymentsQuery(activeProvider?.id ?? "", { skip: !activeProvider });

  if (!activeProvider) {
    return <p className="text-sm text-gray-400">{isBn ? "প্রথমে একটি সক্রিয় প্রোভাইডার যোগ করুন" : "Add an active provider first"}</p>;
  }
  if (isLoading) return <p className="text-sm text-gray-400">{isBn ? "লোড হচ্ছে..." : "Loading..."}</p>;
  if (isError) return <p className="text-sm text-red-500">{isBn ? "পেমেন্ট আনতে ব্যর্থ হয়েছে" : "Failed to load payments"}</p>;

  const rows = normalizeRows(data);
  if (rows.length === 0) return <p className="text-sm text-gray-400">{isBn ? "কোনো পেমেন্ট নেই" : "No payments yet"}</p>;

  const columns = Object.keys(rows[0]);

  return (
    <div className="card p-0 overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-amber-50 border-b border-amber-200">
          <tr>
            {columns.map(col => (
              <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider whitespace-nowrap">
                {col.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              {columns.map(col => (
                <td key={col} className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                  {String(row[col] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

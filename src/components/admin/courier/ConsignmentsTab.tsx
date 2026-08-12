"use client";

import {
  useCreateCourierReturnRequestMutation,
  useGetCourierConsignmentsQuery,
  useGetCourierProvidersQuery,
  useRefreshCourierStatusMutation,
} from "@/api/courier/courierApi";
import TableSkeleton from "@/components/ui/skeletons";
import { toast } from "@/store/toastStore";
import { ExternalLink, RefreshCw, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ConsignmentsTab({ locale, isBn }: { locale: string; isBn: boolean }) {
  const [page, setPage] = useState(1);
  const [providerCode, setProviderCode] = useState("");
  const { data: providers = [] } = useGetCourierProvidersQuery();
  const { data, isLoading } = useGetCourierConsignmentsQuery({ page, provider_code: providerCode || undefined });
  const [refresh] = useRefreshCourierStatusMutation();
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [createReturn, { isLoading: requestingReturn }] = useCreateCourierReturnRequestMutation();
  const [returnTargetId, setReturnTargetId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const selectProvider = (code: string) => {
    setProviderCode(code);
    setPage(1);
  };

  const rows = data?.data ?? [];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(isBn ? "bn-BD" : "en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const handleRefresh = async (orderId: string) => {
    setRefreshingId(orderId);
    try {
      await refresh(orderId).unwrap();
      toast.success(isBn ? "স্ট্যাটাস আপডেট হয়েছে" : "Status refreshed");
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed to refresh");
    } finally {
      setRefreshingId(null);
    }
  };

  const handleRequestReturn = async () => {
    if (!returnTargetId) return;
    try {
      await createReturn({ consignment_id: returnTargetId, reason }).unwrap();
      toast.success(isBn ? "ফেরত অনুরোধ পাঠানো হয়েছে" : "Return request sent");
      setReturnTargetId(null);
      setReason("");
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed to request return");
    }
  };

  const tabs = (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => selectProvider("")}
        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${providerCode === "" ? "bg-amber-600 text-white border-amber-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
      >
        {isBn ? "সব" : "All"}
      </button>
      {providers.map(p => (
        <button
          key={p.id}
          onClick={() => selectProvider(p.code)}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${providerCode === p.code ? "bg-amber-600 text-white border-amber-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );

  if (isLoading) return (
    <div className="space-y-3">
      {tabs}
      <TableSkeleton columns={8} rows={8} />
    </div>
  );
  if (rows.length === 0) return (
    <div className="space-y-3">
      {tabs}
      <p className="text-sm text-gray-400">{isBn ? "কোনো কনসাইনমেন্ট নেই" : "No consignments yet"}</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {tabs}
      <div className="card p-0 overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-amber-50 border-b border-amber-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "অর্ডার" : "Order"}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "প্রোভাইডার" : "Provider"}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "ট্র্যাকিং কোড" : "Tracking Code"}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "স্ট্যাটাস" : "Status"}</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "সিওডি" : "COD"}</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "ওজন" : "Weight"}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "সর্বশেষ" : "Last Update"}</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(c => (
            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <Link href={`/${locale}/admin/orders/${c.order_id}`} className="text-amber-700 hover:underline font-medium">
                  {c.order_number}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-700">{c.provider_name}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.tracking_code || "—"}</td>
              <td className="px-4 py-3">
                <span className="badge bg-gray-100 text-gray-700">{c.status || "—"}</span>
              </td>
              <td className="px-4 py-3 text-right text-gray-700">৳{c.cod_amount}</td>
              <td className="px-4 py-3 text-right text-gray-700">{c.weight ? `${c.weight} kg` : "—"}</td>
              <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(c.updated_at)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1.5">
                  {c.tracking_url && (
                    <div className="relative group">
                      <a
                        href={c.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <span className="pointer-events-none absolute right-0 bottom-full mb-1.5 hidden group-hover:block whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-[11px] text-white z-10">
                        {isBn ? "কুরিয়ারে ট্র্যাক করুন" : "Track on courier site"}
                      </span>
                    </div>
                  )}
                  <div className="relative group">
                    <button
                      onClick={() => handleRefresh(c.order_id)}
                      disabled={refreshingId === c.order_id}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshingId === c.order_id ? "animate-spin" : ""}`} />
                    </button>
                    <span className="pointer-events-none absolute right-0 bottom-full mb-1.5 hidden group-hover:block whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-[11px] text-white z-10">
                      {isBn ? "রিফ্রেশ" : "Refresh"}
                    </span>
                  </div>
                  <div className="relative group">
                    <button
                      onClick={() => setReturnTargetId(c.id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="pointer-events-none absolute right-0 bottom-full mb-1.5 hidden group-hover:block whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-[11px] text-white z-10">
                      {isBn ? "ফেরত অনুরোধ" : "Request return"}
                    </span>
                  </div>
                </div>
              </td>
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

      {returnTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">{isBn ? "ফেরত অনুরোধ করুন" : "Request Return"}</h2>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={isBn ? "কারণ (ঐচ্ছিক)" : "Reason (optional)"}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-500"
            />
            <div className="flex gap-3">
              <button onClick={handleRequestReturn} disabled={requestingReturn} className="flex-1 btn-primary">
                {requestingReturn ? (isBn ? "পাঠানো হচ্ছে..." : "Sending...") : (isBn ? "পাঠান" : "Send")}
              </button>
              <button onClick={() => { setReturnTargetId(null); setReason(""); }} className="flex-1 btn-secondary">
                {isBn ? "বাতিল" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

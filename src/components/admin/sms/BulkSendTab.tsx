"use client";

import { useGetSmsRecipientsQuery, useSendBulkSmsMutation } from "@/api/sms/smsApi";
import { Checkbox, FloatingInput, FloatingTextarea } from "@/components/ui/forms";
import Pagination from "@/components/ui/Pagination";
import { toast } from "@/store/toastStore";
import { formatDate, localName } from "@/utils/format";
import { useLocale } from "next-intl";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

// BulkSMSBD (and GSM networks generally) bill per segment — 70 chars/segment
// for Bangla (Unicode), 160 for plain GSM-7 English, minus a small overhead
// once a message spans more than one segment. Shown so the sender can see
// the real cost before blasting hundreds of recipients.
function countSegments(message: string): number {
  const isUnicode = /[^\x00-\x7F]/.test(message);
  if (!message) return 0;
  const singleCap = isUnicode ? 70 : 160;
  if (message.length <= singleCap) return 1;
  const multiCap = isUnicode ? 67 : 153;
  return Math.ceil(message.length / multiCap);
}

export default function BulkSendTab({ isBn }: { isBn: boolean }) {
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);

  const { data, isLoading } = useGetSmsRecipientsQuery({ page, search: search || undefined });
  const [sendBulk, { isLoading: isSending }] = useSendBulkSmsMutation();

  const recipients = data?.data ?? [];
  const segments = useMemo(() => countSegments(message), [message]);

  const toggle = (phone: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  };

  const allOnPageSelected = recipients.length > 0 && recipients.every(r => selected.has(r.phone));
  const toggleAllOnPage = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allOnPageSelected) recipients.forEach(r => next.delete(r.phone));
      else recipients.forEach(r => next.add(r.phone));
      return next;
    });
  };

  const handleSend = async () => {
    try {
      const res = await sendBulk({ phones: Array.from(selected), message: message.trim() }).unwrap();
      toast.success(
        isBn
          ? `${res.recipient_count} জনকে এসএমএস পাঠানো শুরু হয়েছে`
          : `Sending SMS to ${res.recipient_count} recipient(s) started`
      );
      setSelected(new Set());
      setMessage("");
      setConfirming(false);
    } catch {
      toast.error(isBn ? "পাঠাতে ব্যর্থ হয়েছে" : "Failed to send");
      setConfirming(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      {/* Recipient picker */}
      <div>
        <FloatingInput
          label={isBn ? "নাম বা ফোন নম্বর দিয়ে খুঁজুন" : "Search by name or phone"}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />

        {selected.size > 0 && (
          <div className="flex items-center justify-between px-3 py-2 mt-3 bg-amber-50 border border-amber-100 rounded-lg text-xs">
            <span className="text-amber-700 font-semibold">
              {isBn ? `${selected.size} জন নির্বাচিত` : `${selected.size} recipient(s) selected`}
            </span>
            <button type="button" onClick={() => setSelected(new Set())} className="text-gray-400 hover:text-red-600 inline-flex items-center gap-1">
              <X className="w-3 h-3" /> {isBn ? "মুছুন" : "Clear"}
            </button>
          </div>
        )}

        <div className="border border-gray-100 rounded-lg mt-3 divide-y divide-gray-50">
          <label className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 cursor-pointer">
            <Checkbox checked={allOnPageSelected} onChange={toggleAllOnPage} label="" />
            <span className="text-xs font-semibold text-gray-500">
              {isBn ? "এই পাতার সবাইকে নির্বাচন করুন" : "Select all on this page"}
            </span>
          </label>

          {isLoading ? (
            <p className="text-center text-xs text-gray-400 py-6">{isBn ? "লোড হচ্ছে..." : "Loading..."}</p>
          ) : recipients.length ? (
            recipients.map(r => (
              <label key={r.phone} className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
                <Checkbox checked={selected.has(r.phone)} onChange={() => toggle(r.phone)} label="" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm text-gray-700">{localName(r.name_bn, r.name_en, isBn) || "—"}</div>
                  <div className="text-[11px] text-gray-400 font-mono">{r.phone}</div>
                </div>
                <div className="text-right text-[11px] text-gray-400 shrink-0">
                  <div>{isBn ? `${r.order_count} অর্ডার` : `${r.order_count} order(s)`}</div>
                  {r.last_order_at && <div>{formatDate(r.last_order_at, locale)}</div>}
                </div>
              </label>
            ))
          ) : (
            <p className="text-center text-xs text-gray-400 py-6">{isBn ? "কোনো গ্রাহক পাওয়া যায়নি" : "No customers found"}</p>
          )}
        </div>

        {data && (data.pagination.total_pages ?? 1) > 1 && (
          <div className="mt-3">
            <Pagination page={page} totalPages={data.pagination.total_pages ?? 1} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Compose */}
      <div className="space-y-3">
        <FloatingTextarea
          label={isBn ? "বার্তা লিখুন" : "Write your message"}
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={6}
        />
        <p className="text-xs text-gray-400">
          {isBn
            ? `${message.length} অক্ষর · ${segments || 0} এসএমএস সেগমেন্ট / প্রাপক`
            : `${message.length} characters · ${segments || 0} SMS segment(s) per recipient`}
        </p>

        {!confirming ? (
          <button
            type="button"
            disabled={selected.size === 0 || !message.trim() || isSending}
            onClick={() => setConfirming(true)}
            className="btn-primary w-full disabled:opacity-50"
          >
            {isBn ? `${selected.size} জনকে পাঠান` : `Send to ${selected.size} recipient(s)`}
          </button>
        ) : (
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-2">
            <p className="text-xs text-gray-700">
              {isBn
                ? `আপনি ${selected.size} জন গ্রাহককে এই এসএমএস পাঠাতে যাচ্ছেন। এটি বাতিল করা যাবে না। নিশ্চিত?`
                : `You're about to send this SMS to ${selected.size} recipient(s). This can't be undone. Confirm?`}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={handleSend} disabled={isSending} className="btn-primary flex-1 text-sm">
                {isSending ? (isBn ? "পাঠানো হচ্ছে..." : "Sending...") : (isBn ? "হ্যাঁ, পাঠান" : "Yes, send")}
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={isSending} className="btn-secondary flex-1 text-sm">
                {isBn ? "বাতিল" : "Cancel"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

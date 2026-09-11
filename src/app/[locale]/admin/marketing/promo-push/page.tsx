"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Eye, BellRing, Send } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { ReusableTable, Column, QuickAction } from "@/components/ui/ReusableTable";
import { toast } from "@/store/toastStore";
import {
  PromoPush,
  useGetPromoPushesQuery,
  useSendPromoPushMutation,
} from "@/api/marketing/promoPushApi";

const EMPTY_FORM = {
  title_bn: "",
  title_en: "",
  body_bn: "",
  body_en: "",
};

export default function PromoPushAdminPage() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const [form, setForm] = useState(EMPTY_FORM);
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [viewItem, setViewItem] = useState<PromoPush | null>(null);

  const { data, isLoading, isFetching } = useGetPromoPushesQuery({ page, page_size: 10 });
  const [sendPromoPush, { isLoading: sending }] = useSendPromoPushMutation();

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const isValid = form.title_bn.trim() && form.title_en.trim();

  const handleSend = async () => {
    try {
      const result = await sendPromoPush(form).unwrap();
      toast.success(
        isBn
          ? `${result.recipient_count} টি ডিভাইসের মধ্যে ${result.delivered_count} টিতে পাঠানো হয়েছে`
          : `Delivered to ${result.delivered_count} of ${result.recipient_count} devices`
      );
      setForm(EMPTY_FORM);
    } catch {
      toast.error(isBn ? "পাঠাতে ব্যর্থ হয়েছে" : "Failed to send");
    } finally {
      setConfirming(false);
    }
  };

  const quickActions: QuickAction<PromoPush>[] = [
    {
      label: "View",
      icon: <Eye className="w-3.5 h-3.5" />,
      onClick: setViewItem,
      className: "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors",
    },
  ];

  const columns: Column<PromoPush>[] = [
    {
      header: isBn ? "শিরোনাম" : "Title",
      accessor: p => (
        <div>
          <p className="text-sm font-medium text-gray-800">{isBn ? p.title_bn : p.title_en}</p>
          <p className="text-xs text-gray-400">{p.sent_by ?? "—"}</p>
        </div>
      ),
    },
    {
      header: isBn ? "প্রাপক" : "Recipients",
      accessor: p => <span className="text-sm text-gray-600">{p.recipient_count}</span>,
    },
    {
      header: isBn ? "ডেলিভার হয়েছে" : "Delivered",
      accessor: p => (
        <span className={`text-sm font-medium ${p.delivered_count > 0 ? "text-green-600" : "text-red-500"}`}>
          {p.delivered_count} / {p.recipient_count}
        </span>
      ),
    },
    {
      header: isBn ? "তারিখ" : "Date",
      accessor: p => <span className="text-xs text-gray-500">{new Date(p.created_at).toLocaleString(locale)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title={isBn ? "প্রমোশনাল পুশ নোটিফিকেশন" : "Promotional Push Notifications"}
        description={
          isBn
            ? "মোবাইল অ্যাপ ব্যবহারকারী গ্রাহকদের ফোনে সরাসরি পুশ নোটিফিকেশন পাঠান"
            : "Send a push notification straight to the phones of customers who have the mobile app"
        }
      />

      <div className="card mb-6 space-y-4">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          <BellRing className="w-4 h-4" />
          {isBn ? "নতুন নোটিফিকেশন কম্পোজ করুন" : "Compose New Notification"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">{isBn ? "শিরোনাম (বাংলা)" : "Title (Bengali)"}</label>
            <input
              value={form.title_bn}
              onChange={e => set("title_bn", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              placeholder={isBn ? "যেমনঃ দুর্গাপূজার অফার শুরু হয়েছে!" : "e.g. Durga Puja offer is live!"}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">{isBn ? "শিরোনাম (ইংরেজি)" : "Title (English)"}</label>
            <input
              value={form.title_en}
              onChange={e => set("title_en", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              placeholder="e.g. Durga Puja offer is live!"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">{isBn ? "বার্তা (বাংলা)" : "Message (Bengali)"}</label>
            <textarea
              value={form.body_bn}
              onChange={e => set("body_bn", e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">{isBn ? "বার্তা (ইংরেজি)" : "Message (English)"}</label>
            <textarea
              value={form.body_en}
              onChange={e => set("body_en", e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>
        </div>

        <p className="text-xs text-gray-400">
          {isBn
            ? "শুধুমাত্র মোবাইল অ্যাপ ব্যবহারকারী গ্রাহকরাই এটি পাবেন — যাদের ফোনে অ্যাপ ইনস্টল করা নেই তারা পাবেন না।"
            : "Only reaches customers who have the mobile app installed — not the website audience."}
        </p>

        <button
          onClick={() => setConfirming(true)}
          disabled={!isValid || sending}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {isBn ? "পাঠান" : "Send"}
        </button>
      </div>

      {confirming && (
        <ConfirmModal
          icon={<Send className="w-6 h-6 text-amber-500" />}
          title={isBn ? "নোটিফিকেশন পাঠাবেন?" : "Send this notification?"}
          description={
            isBn
              ? "এই নোটিফিকেশনটি অ্যাপে থাকা সব গ্রাহকের ফোনে পাঠানো হবে। এই কাজটি বাতিল করা যাবে না।"
              : "This notification will be pushed to every customer with the app installed. This cannot be undone."
          }
          confirmLabel={isBn ? "হ্যাঁ, পাঠান" : "Yes, Send"}
          loading={sending}
          onConfirm={handleSend}
          onCancel={() => setConfirming(false)}
        />
      )}

      <ReusableTable
        data={data?.data ?? []}
        columns={columns}
        keyExtractor={p => p.id}
        isLoading={isLoading || isFetching}
        quickActions={quickActions}
        totalPages={data?.pagination?.total_pages ?? 1}
        currentPage={page}
        onPageChange={setPage}
        emptyMessage={isBn ? "এখনো কোনো পুশ নোটিফিকেশন পাঠানো হয়নি।" : "No push notifications sent yet."}
      />

      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setViewItem(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-500" />
                {isBn ? "নোটিফিকেশন বিস্তারিত" : "Notification Details"}
              </h2>
            </div>

            <div className="text-xs text-gray-400 flex items-center gap-3">
              <span>{isBn ? "প্রাপক" : "Recipients"}: {viewItem.recipient_count}</span>
              <span>·</span>
              <span>{new Date(viewItem.created_at).toLocaleString(locale)}</span>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">{isBn ? "শিরোনাম (বাংলা)" : "Title (Bengali)"}</p>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{viewItem.title_bn}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">{isBn ? "শিরোনাম (ইংরেজি)" : "Title (English)"}</p>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{viewItem.title_en}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">{isBn ? "বার্তা (বাংলা)" : "Message (Bengali)"}</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">{viewItem.body_bn || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">{isBn ? "বার্তা (ইংরেজি)" : "Message (English)"}</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">{viewItem.body_en || "—"}</p>
              </div>
            </div>

            <button
              onClick={() => setViewItem(null)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {isBn ? "বন্ধ করুন" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

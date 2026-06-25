"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Eye, Mail, Send, RefreshCw } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Badge from "@/components/ui/Badge";
import { ReusableTable, Column, QuickAction } from "@/components/ui/ReusableTable";
import { toast } from "@/store/toastStore";
import {
  PromoEmail,
  PromoEmailType,
  useGetPromoEmailsQuery,
  useGetPromoEmailAudienceQuery,
  useCreatePromoEmailMutation,
  useResendPromoEmailMutation,
} from "@/api/marketing/promoEmailApi";

const TYPE_LABELS: Record<PromoEmailType, { bn: string; en: string }> = {
  NEW_PRODUCT: { bn: "নতুন পণ্য", en: "New Product" },
  NEW_PACKAGE: { bn: "নতুন প্যাকেজ", en: "New Package" },
  OFFER:       { bn: "অফার", en: "Offer" },
  GENERAL:     { bn: "সাধারণ", en: "General" },
};

const STATUS_VARIANT: Record<PromoEmail["status"], "green" | "red" | "yellow"> = {
  SENT:    "green",
  FAILED:  "red",
  PENDING: "yellow",
};

const EMPTY_FORM = {
  email_type: "GENERAL" as PromoEmailType,
  subject_bn: "",
  subject_en: "",
  message_bn: "",
  message_en: "",
};

export default function PromoEmailsAdminPage() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const [form, setForm] = useState(EMPTY_FORM);
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [viewItem, setViewItem] = useState<PromoEmail | null>(null);
  const [resendTarget, setResendTarget] = useState<PromoEmail | null>(null);

  const { data, isLoading } = useGetPromoEmailsQuery({ page, page_size: 10 });
  const { data: audience } = useGetPromoEmailAudienceQuery(form.email_type);
  const [createPromoEmail, { isLoading: sending }] = useCreatePromoEmailMutation();
  const [resendPromoEmail, { isLoading: resending }] = useResendPromoEmailMutation();

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const isValid =
    form.subject_bn.trim() && form.subject_en.trim() &&
    form.message_bn.trim() && form.message_en.trim();

  const handleSend = async () => {
    try {
      await createPromoEmail(form).unwrap();
      toast.success(isBn ? "ইমেইল পাঠানোর জন্য সারিবদ্ধ হয়েছে" : "Email queued for sending");
      setForm(EMPTY_FORM);
    } catch {
      toast.error(isBn ? "পাঠাতে ব্যর্থ হয়েছে" : "Failed to send");
    } finally {
      setConfirming(false);
    }
  };

  const handleResend = async () => {
    if (!resendTarget) return;
    try {
      await resendPromoEmail(resendTarget.id).unwrap();
      toast.success(isBn ? "ইমেইল পুনরায় পাঠানোর জন্য সারিবদ্ধ হয়েছে" : "Email queued for resending");
    } catch {
      toast.error(isBn ? "পুনরায় পাঠাতে ব্যর্থ হয়েছে" : "Failed to resend");
    } finally {
      setResendTarget(null);
    }
  };

  const quickActions: QuickAction<PromoEmail>[] = [
    {
      label: "View",
      icon: <Eye className="w-3.5 h-3.5" />,
      onClick: setViewItem,
      className: "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors",
    },
    {
      label: "Resend",
      icon: <RefreshCw className="w-3.5 h-3.5" />,
      onClick: setResendTarget,
      className: "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors",
    },
  ];

  const columns: Column<PromoEmail>[] = [
    {
      header: isBn ? "ধরন" : "Type",
      accessor: e => <span className="text-xs font-medium text-gray-700">{isBn ? TYPE_LABELS[e.email_type].bn : TYPE_LABELS[e.email_type].en}</span>,
    },
    {
      header: isBn ? "বিষয়" : "Subject",
      accessor: e => (
        <div>
          <p className="text-sm font-medium text-gray-800">{isBn ? e.subject_bn : e.subject_en}</p>
          <p className="text-xs text-gray-400">{e.sent_by_name ?? "—"}</p>
        </div>
      ),
    },
    {
      header: isBn ? "প্রাপক" : "Recipients",
      accessor: e => <span className="text-sm text-gray-600">{e.recipient_count}</span>,
    },
    {
      header: isBn ? "স্ট্যাটাস" : "Status",
      accessor: e => <Badge variant={STATUS_VARIANT[e.status]}>{e.status}</Badge>,
    },
    {
      header: isBn ? "তারিখ" : "Date",
      accessor: e => <span className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString(locale)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title={isBn ? "প্রোমো ইমেইল" : "Promo Emails"}
        description={isBn ? "নিবন্ধিত গ্রাহকদের কাছে প্রচারণামূলক ইমেইল পাঠান" : "Send promotional emails to registered customers"}
      />

      <div className="card mb-6 space-y-4">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          <Mail className="w-4 h-4" />
          {isBn ? "নতুন ইমেইল কম্পোজ করুন" : "Compose New Email"}
        </h2>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">{isBn ? "ধরন" : "Type"}</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TYPE_LABELS) as PromoEmailType[]).map(t => (
              <button
                key={t}
                onClick={() => set("email_type", t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  form.email_type === t
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {isBn ? TYPE_LABELS[t].bn : TYPE_LABELS[t].en}
              </button>
            ))}
          </div>
          {audience !== undefined && (
            <p className="text-xs text-gray-400 mt-1.5">
              {isBn
                ? `এই ধরনের জন্য আনুমানিক ${audience.recipient_count} জন গ্রাহক ইমেইল পাবেন।`
                : `Approximately ${audience.recipient_count} customers will receive this.`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">{isBn ? "বিষয় (বাংলা)" : "Subject (Bengali)"}</label>
            <input
              value={form.subject_bn}
              onChange={e => set("subject_bn", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              placeholder={isBn ? "যেমনঃ নতুন পণ্য এসেছে!" : "e.g. New product launched!"}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">{isBn ? "বিষয় (ইংরেজি)" : "Subject (English)"}</label>
            <input
              value={form.subject_en}
              onChange={e => set("subject_en", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              placeholder="e.g. New product launched!"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">{isBn ? "বার্তা (বাংলা)" : "Message (Bengali)"}</label>
            <textarea
              value={form.message_bn}
              onChange={e => set("message_bn", e.target.value)}
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">{isBn ? "বার্তা (ইংরেজি)" : "Message (English)"}</label>
            <textarea
              value={form.message_en}
              onChange={e => set("message_en", e.target.value)}
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>
        </div>

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
          title={isBn ? "ইমেইল পাঠাবেন?" : "Send this email?"}
          description={
            isBn
              ? `প্রায় ${audience?.recipient_count ?? 0} জন গ্রাহকের কাছে এই ইমেইল পাঠানো হবে। এই কাজটি বাতিল করা যাবে না।`
              : `This email will be sent to approximately ${audience?.recipient_count ?? 0} customers. This cannot be undone.`
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
        keyExtractor={e => e.id}
        isLoading={isLoading}
        quickActions={quickActions}
        totalPages={data?.pagination?.total_pages ?? 1}
        currentPage={page}
        onPageChange={setPage}
        emptyMessage={isBn ? "এখনো কোনো প্রোমো ইমেইল পাঠানো হয়নি।" : "No promo emails sent yet."}
      />

      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setViewItem(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-500" />
                {isBn ? "ইমেইল বিস্তারিত" : "Email Details"}
              </h2>
              <Badge variant={STATUS_VARIANT[viewItem.status]}>{viewItem.status}</Badge>
            </div>

            <div className="text-xs text-gray-400 flex items-center gap-3">
              <span>{isBn ? TYPE_LABELS[viewItem.email_type].bn : TYPE_LABELS[viewItem.email_type].en}</span>
              <span>·</span>
              <span>{isBn ? "প্রাপক" : "Recipients"}: {viewItem.recipient_count}</span>
              <span>·</span>
              <span>{new Date(viewItem.created_at).toLocaleString(locale)}</span>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">{isBn ? "বিষয় (বাংলা)" : "Subject (Bengali)"}</p>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{viewItem.subject_bn}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">{isBn ? "বিষয় (ইংরেজি)" : "Subject (English)"}</p>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{viewItem.subject_en}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">{isBn ? "বার্তা (বাংলা)" : "Message (Bengali)"}</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">{viewItem.message_bn}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">{isBn ? "বার্তা (ইংরেজি)" : "Message (English)"}</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">{viewItem.message_en}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setResendTarget(viewItem); setViewItem(null); }}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                {isBn ? "পুনরায় পাঠান" : "Resend"}
              </button>
              <button
                onClick={() => setViewItem(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {isBn ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {resendTarget && (
        <ConfirmModal
          icon={<RefreshCw className="w-6 h-6 text-amber-500" />}
          title={isBn ? "ইমেইল পুনরায় পাঠাবেন?" : "Resend this email?"}
          description={
            isBn
              ? `"${resendTarget.subject_bn}" শিরোনামের ইমেইলটি একই বিষয়বস্তু সহ আবার পাঠানো হবে।`
              : `"${resendTarget.subject_en}" will be sent again with the same content to its audience.`
          }
          confirmLabel={isBn ? "হ্যাঁ, পুনরায় পাঠান" : "Yes, Resend"}
          loading={resending}
          onConfirm={handleResend}
          onCancel={() => setResendTarget(null)}
        />
      )}
    </div>
  );
}

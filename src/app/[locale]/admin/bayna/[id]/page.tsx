"use client";

import { useGetMeQuery } from "@/api/auth/authApi";
import { useGetBaynaBookingQuery, useUpdateBaynaBookingMutation } from "@/api/bayna/baynaApi";
import Badge from "@/components/ui/Badge";
import { FloatingDatePicker, FloatingSelect, FloatingTextarea } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { BaynaStatus } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { getErrorMessage } from "@/utils/apiError";
import { hasPermission } from "@/utils/permissions";
import { formatDate } from "@/utils/format";
import { Pencil } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

const SERVICE_LABELS: Record<string, { bn: string; en: string }> = {
  PUJARI: { bn: "পূজারী", en: "Pujari" },
  DHAKI:  { bn: "ঢাকি",    en: "Dhaki" },
  MURTI:  { bn: "মূর্তি",   en: "Murti" },
};

const STATUS_OPTIONS: { value: BaynaStatus; bn: string; en: string }[] = [
  { value: "PENDING",   bn: "পেন্ডিং",       en: "Pending" },
  { value: "CONTACTED", bn: "যোগাযোগ হয়েছে", en: "Contacted" },
  { value: "CONFIRMED", bn: "নিশ্চিত",        en: "Confirmed" },
  { value: "COMPLETED", bn: "সম্পন্ন",         en: "Completed" },
  { value: "CANCELLED", bn: "বাতিল",          en: "Cancelled" },
];

const STATUS_BADGE_VARIANT: Record<BaynaStatus, "gray" | "blue" | "green" | "red"> = {
  PENDING: "gray", CONTACTED: "blue", CONFIRMED: "green", COMPLETED: "green", CANCELLED: "red",
};

export default function BaynaBookingDetailPage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const isBn = locale === "bn";

  const { data: me } = useGetMeQuery();
  const canEdit = hasPermission(me, "bayna", "edit");

  const { data: booking, isLoading } = useGetBaynaBookingQuery(params.id);
  const [updateBooking, { isLoading: saving }] = useUpdateBaynaBookingMutation();

  const [status, setStatus] = useState<BaynaStatus>("PENDING");
  const [adminNotes, setAdminNotes] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [editingDate, setEditingDate] = useState(false);

  useEffect(() => {
    if (booking) {
      setStatus(booking.status);
      setAdminNotes(booking.admin_notes);
      setEventDate(booking.event_date);
    }
  }, [booking]);

  const handleSave = async () => {
    try {
      await updateBooking({ id: params.id, status, admin_notes: adminNotes, event_date: eventDate }).unwrap();
      setEditingDate(false);
      toast.success(isBn ? "আপডেট হয়েছে" : "Updated");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  if (isLoading || !booking) return <Spinner />;

  return (
    <div className="max-w-7xl">
      <PageHeader
        title={isBn ? SERVICE_LABELS[booking.service_type]?.bn : SERVICE_LABELS[booking.service_type]?.en}
        description={`${booking.name} · ${booking.phone}`}
        showBack
        backHref={`/${locale}/admin/bayna`}
        backLabel={isBn ? "বায়না তালিকা" : "Bayna Bookings"}
        actions={<Badge variant={STATUS_BADGE_VARIANT[booking.status]}>{STATUS_OPTIONS.find(s => s.value === booking.status)?.[isBn ? "bn" : "en"]}</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Request Details */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
            {isBn ? "অনুরোধের তথ্য" : "Request Details"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{isBn ? "নাম" : "Name"}</p>
              <p className="text-gray-800 font-medium">{booking.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{isBn ? "ফোন" : "Phone"}</p>
              <p className="text-gray-800 font-medium">{booking.phone}</p>
            </div>
            {booking.email && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{isBn ? "ইমেইল" : "Email"}</p>
                <p className="text-gray-800">{booking.email}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{isBn ? "স্থান" : "Location"}</p>
              <p className="text-gray-800">{booking.location}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-400 mb-0.5">{isBn ? "অনুষ্ঠানের তারিখ" : "Event Date"}</p>
              {editingDate ? (
                <FloatingDatePicker
                  label={isBn ? "অনুষ্ঠানের তারিখ" : "Event Date"}
                  value={eventDate}
                  onChange={setEventDate}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-gray-800 font-medium">{formatDate(eventDate, locale)}</p>
                  {canEdit && (
                    <button
                      onClick={() => setEditingDate(true)}
                      aria-label={isBn ? "তারিখ পরিবর্তন করুন" : "Edit date"}
                      className="text-gray-400 hover:text-amber-700 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              {editingDate && (
                <p className="text-xs text-gray-400 mt-1">
                  {isBn ? "\"সংরক্ষণ করুন\" চাপলে নতুন তারিখ সংরক্ষিত হবে" : "Click \"Save\" below to store the new date"}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{isBn ? "জমা দেওয়া হয়েছে" : "Submitted"}</p>
              <p className="text-gray-800">{formatDate(booking.created_at, locale)}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">{isBn ? "বিবরণ" : "Description"}</p>
            <p className="text-gray-700 whitespace-pre-wrap">{booking.description}</p>
          </div>
        </div>

        {/* Right: Staff Management */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
            {isBn ? "স্ট্যাফ ব্যবস্থাপনা" : "Staff Management"}
          </h2>
          <FloatingSelect
            label={isBn ? "স্ট্যাটাস" : "Status"}
            value={status}
            onChange={v => setStatus(v as BaynaStatus)}
            disabled={!canEdit}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{isBn ? s.bn : s.en}</option>
            ))}
          </FloatingSelect>
          <FloatingTextarea
            label={isBn ? "অভ্যন্তরীণ নোট (গ্রাহক দেখতে পাবে না)" : "Internal Notes (not visible to customer)"}
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            rows={4}
            disabled={!canEdit}
          />
          {canEdit && (
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

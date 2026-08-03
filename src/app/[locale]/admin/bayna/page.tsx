"use client";

import { useGetBaynaBookingsQuery } from "@/api/bayna/baynaApi";
import Badge from "@/components/ui/Badge";
import { FloatingSelect } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import { Column, ReusableTable } from "@/components/ui/ReusableTable";
import { BaynaBooking, BaynaStatus } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { formatDate } from "@/utils/format";
import { hasPermission } from "@/utils/permissions";
import { Eye } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SERVICE_LABELS: Record<string, { bn: string; en: string }> = {
  PUJARI: { bn: "পূজারী", en: "Pujari" },
  DHAKI:  { bn: "ঢাকি",    en: "Dhaki" },
  MURTI:  { bn: "মূর্তি",   en: "Murti" },
};

const STATUS_BADGE: Record<BaynaStatus, { variant: "gray" | "blue" | "green" | "red"; bn: string; en: string }> = {
  PENDING:   { variant: "gray",  bn: "পেন্ডিং",       en: "Pending" },
  CONTACTED: { variant: "blue",  bn: "যোগাযোগ হয়েছে", en: "Contacted" },
  CONFIRMED: { variant: "green", bn: "নিশ্চিত",        en: "Confirmed" },
  COMPLETED: { variant: "green", bn: "সম্পন্ন",         en: "Completed" },
  CANCELLED: { variant: "red",   bn: "বাতিল",          en: "Cancelled" },
};

export default function BaynaBookingsPage() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const router = useRouter();
  const canCreate = useAuthStore(s => hasPermission(s.user, "bayna", "create"));

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState("");
  const [serviceType, setServiceType] = useState("");

  const { data, isLoading } = useGetBaynaBookingsQuery({ page, status, service_type: serviceType });

  const columns: Column<BaynaBooking>[] = [
    {
      header: isBn ? "সেবা" : "Service",
      accessor: b => isBn ? SERVICE_LABELS[b.service_type]?.bn : SERVICE_LABELS[b.service_type]?.en,
      exportValue: b => b.service_type,
    },
    {
      header: isBn ? "গ্রাহক" : "Customer",
      accessor: b => (
        <div>
          <p className="text-sm font-medium text-gray-800">{b.name}</p>
          <p className="text-xs text-gray-400">{b.phone}</p>
        </div>
      ),
      exportValue: b => `${b.name} / ${b.phone}`,
    },
    {
      header: isBn ? "অনুষ্ঠানের তারিখ" : "Event Date",
      accessor: b => <span className="text-sm text-gray-600">{formatDate(b.event_date, locale)}</span>,
      exportValue: b => b.event_date,
    },
    {
      header: isBn ? "স্ট্যাটাস" : "Status",
      accessor: b => <Badge variant={STATUS_BADGE[b.status].variant}>{isBn ? STATUS_BADGE[b.status].bn : STATUS_BADGE[b.status].en}</Badge>,
      exportValue: b => b.status,
    },
    {
      header: isBn ? "তৈরি" : "Created",
      accessor: b => <span className="text-xs text-gray-500">{formatDate(b.created_at, locale)}</span>,
      exportValue: b => b.created_at,
    },
  ];

  return (
    <div>
      <PageHeader
        title={isBn ? "বায়না বুকিং" : "Bayna Bookings"}
        description={isBn ? "গ্রাহকদের বায়না অনুরোধ দেখুন ও পরিচালনা করুন" : "View and manage customer bayna requests"}
        {...(canCreate && {
          addLabel: isBn ? "নতুন বুকিং" : "New Booking",
          onAdd: () => router.push(`/${locale}/admin/bayna/new`),
        })}
      />

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <FloatingSelect
          label={isBn ? "সেবার ধরন" : "Service Type"}
          value={serviceType}
          onChange={v => { setServiceType(v); setPage(1); }}
        >
          <option value="">{isBn ? "সব" : "All"}</option>
          <option value="PUJARI">{isBn ? "পূজারী" : "Pujari"}</option>
          <option value="DHAKI">{isBn ? "ঢাকি" : "Dhaki"}</option>
          <option value="MURTI">{isBn ? "মূর্তি" : "Murti"}</option>
        </FloatingSelect>
        <FloatingSelect
          label={isBn ? "স্ট্যাটাস" : "Status"}
          value={status}
          onChange={v => { setStatus(v); setPage(1); }}
        >
          <option value="">{isBn ? "সব" : "All"}</option>
          {(Object.keys(STATUS_BADGE) as BaynaStatus[]).map(s => (
            <option key={s} value={s}>{isBn ? STATUS_BADGE[s].bn : STATUS_BADGE[s].en}</option>
          ))}
        </FloatingSelect>
      </div>

      <ReusableTable
        data={data?.data ?? []}
        columns={columns}
        keyExtractor={b => b.id}
        isLoading={isLoading}
        totalPages={data?.pagination?.total_pages ?? 1}
        totalRecords={data?.pagination?.total}
        currentPage={page}
        onPageChange={setPage}
        limit={limit}
        onLimitChange={l => { setLimit(l); setPage(1); }}
        exportFilename="bayna-bookings"
        emptyMessage={isBn ? "কোনো বায়না অনুরোধ নেই" : "No bayna requests found"}
        quickActions={[{
          label: isBn ? "দেখুন" : "View",
          render: b => (
            <Link
              href={`/${locale}/admin/bayna/${b.id}`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              title={isBn ? "দেখুন" : "View"}
            >
              <Eye className="w-3.5 h-3.5" />
            </Link>
          ),
        }]}
      />
    </div>
  );
}

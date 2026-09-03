"use client";

import { useGetSmsLogsQuery, SmsLogRow } from "@/api/sms/smsApi";
import Badge from "@/components/ui/Badge";
import { FloatingDatePicker, FloatingInput, FloatingSelect } from "@/components/ui/forms";
import { Column, ReusableTable } from "@/components/ui/ReusableTable";
import { formatDate } from "@/utils/format";
import { useLocale } from "next-intl";
import { useState } from "react";

export default function LogsTab({ isBn }: { isBn: boolean }) {
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [phone, setPhone] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, isLoading, isFetching } = useGetSmsLogsQuery({
    page,
    status: status || undefined,
    phone: phone || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const columns: Column<SmsLogRow>[] = [
    {
      header: isBn ? "তারিখ" : "Date",
      accessor: r => <span className="text-xs text-gray-500">{formatDate(r.created_at, locale)}</span>,
      exportValue: r => new Date(r.created_at).toLocaleString(),
    },
    {
      header: isBn ? "ফোন" : "Phone",
      accessor: r => <span className="font-mono text-sm">{r.phone}</span>,
      exportValue: r => r.phone,
    },
    {
      header: isBn ? "অর্ডার নম্বর" : "Order Number",
      accessor: r => r.order_number || "—",
      exportValue: r => r.order_number || "",
    },
    {
      header: isBn ? "বার্তা" : "Message",
      accessor: r => <span className="text-xs text-gray-600 line-clamp-2 max-w-xs block">{r.message}</span>,
      exportValue: r => r.message,
    },
    {
      header: isBn ? "অবস্থা" : "Status",
      accessor: r => (
        <Badge variant={r.status === "SUCCESS" ? "green" : "red"}>
          {r.status === "SUCCESS" ? (isBn ? "সফল" : "Success") : (isBn ? "ব্যর্থ" : "Failed")}
        </Badge>
      ),
      exportValue: r => r.status,
    },
    {
      header: isBn ? "প্রতিক্রিয়া" : "Response",
      accessor: r => <span className="text-xs text-gray-400">{r.response_text || "—"}</span>,
      exportValue: r => r.response_text,
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <FloatingInput label={isBn ? "ফোন নম্বর" : "Phone Number"} value={phone} onChange={e => setPhone(e.target.value)} />
        <FloatingSelect
          label={isBn ? "অবস্থা" : "Status"}
          value={status}
          onChange={setStatus}
          showClearButton={!!status}
          onClear={() => setStatus("")}
          options={[
            { value: "SUCCESS", label: isBn ? "সফল" : "Success" },
            { value: "FAILED", label: isBn ? "ব্যর্থ" : "Failed" },
          ]}
        />
        <FloatingDatePicker label={isBn ? "শুরু তারিখ" : "From"} value={from} onChange={setFrom} clearable />
        <FloatingDatePicker label={isBn ? "শেষ তারিখ" : "To"} value={to} onChange={setTo} clearable />
      </div>

      <ReusableTable
        data={data?.data ?? []}
        columns={columns}
        keyExtractor={r => r.id}
        isLoading={isLoading || isFetching}
        totalPages={data?.pagination?.total_pages ?? 1}
        totalRecords={data?.pagination?.total}
        currentPage={page}
        onPageChange={setPage}
        emptyMessage={isBn ? "কোনো এসএমএস পাঠানো হয়নি" : "No SMS sent yet"}
        exportFilename="sms-logs"
      />
    </div>
  );
}

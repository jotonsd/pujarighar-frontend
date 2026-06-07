import { DeliveryInfo, StatusLogEntry } from "@/lib/types";

interface Props {
  logs: StatusLogEntry[];
  locale: string;
  deliveryInfo?: DeliveryInfo | null;
}

const STATUS_LABELS: Record<string, { bn: string; en: string }> = {
  PENDING: { bn: "পেন্ডিং", en: "Pending" },
  CONFIRMED: { bn: "নিশ্চিত", en: "Confirmed" },
  PACKED: { bn: "প্যাক হয়েছে", en: "Packed" },
  ASSIGNED: { bn: "ডেলিভারিম্যান নির্ধারিত", en: "Assigned" },
  ON_THE_WAY: { bn: "পথে আছে", en: "On the Way" },
  DELIVERED: { bn: "ডেলিভারি হয়েছে", en: "Delivered" },
  RETURNED: { bn: "ফেরত", en: "Returned" },
  CANCELLED: { bn: "বাতিল", en: "Cancelled" },
};

function statusLabel(status: string, isBn: boolean): string {
  const entry = STATUS_LABELS[status];
  if (!entry) return status;
  return isBn ? entry.bn : entry.en;
}

function fmt(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale === "bn" ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StatusTimeline({ logs, locale, deliveryInfo }: Props) {
  const isBn = locale === "bn";

  return (
    <div className="relative space-y-0">
      {logs.map((log, i) => (
        <div key={log.id} className="flex gap-3">
          {/* Line */}
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-amber-500 rounded-full mt-1 shrink-0" />
            {i < logs.length - 1 && (
              <div className="w-0.5 bg-amber-200 flex-1 my-1" />
            )}
          </div>

          {/* Content */}
          <div className="pb-4">
            <p className="font-medium text-gray-800 text-sm">
              {statusLabel(log.to_status, isBn)}
            </p>

            {/* Delivery person — before the timestamp */}
            {log.to_status === "ASSIGNED" && deliveryInfo && (
              <p className="text-xs text-gray-600 mt-0.5">
                🚚{" "}
                {isBn
                  ? deliveryInfo.name_bn || deliveryInfo.name_en
                  : deliveryInfo.name_en || deliveryInfo.name_bn}{" "}
                ({deliveryInfo.phone})
              </p>
            )}

            <p className="text-xs text-gray-400">
              {new Date(log.changed_at).toLocaleString(
                isBn ? "bn-BD" : "en-US",
              )}
            </p>
            {(log.note_bn || log.note_en) && (
              <p className="text-xs text-gray-500 mt-1">
                {isBn ? log.note_bn : log.note_en}
              </p>
            )}

            {/* Picked-up timestamp inline under ON_THE_WAY entry */}
            {log.to_status === "ON_THE_WAY" && deliveryInfo?.picked_up_at && (
              <p className="text-xs text-gray-400 mt-1">
                {isBn ? "পিকআপ: " : "Picked up: "}
                {fmt(deliveryInfo.picked_up_at, locale)}
              </p>
            )}

            {/* Delivered timestamp inline under DELIVERED entry */}
            {log.to_status === "DELIVERED" && deliveryInfo?.delivered_at && (
              <p className="text-xs text-gray-400 mt-1">
                {isBn ? "ডেলিভারি: " : "Delivered: "}
                {fmt(deliveryInfo.delivered_at, locale)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

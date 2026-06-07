import Badge from "@/components/ui/Badge";
import { OrderStatus } from "@/lib/types";

const statusVariants: Record<
  OrderStatus,
  "gray" | "blue" | "yellow" | "orange" | "green" | "red"
> = {
  PENDING: "yellow",
  CONFIRMED: "blue",
  PACKED: "blue",
  ASSIGNED: "orange",
  ON_THE_WAY: "orange",
  DELIVERED: "green",
  RETURNED: "red",
  CANCELLED: "red",
};

const statusLabels: Record<OrderStatus, { bn: string; en: string }> = {
  PENDING: { bn: "পেন্ডিং", en: "Pending" },
  CONFIRMED: { bn: "নিশ্চিত", en: "Confirmed" },
  PACKED: { bn: "প্যাক হয়েছে", en: "Packed" },
  ASSIGNED: { bn: "ডেলিভারি নির্ধারিত", en: "Assigned" },
  ON_THE_WAY: { bn: "পথে আছে", en: "On the Way" },
  DELIVERED: { bn: "ডেলিভারি হয়েছে", en: "Delivered" },
  RETURNED: { bn: "ফেরত", en: "Returned" },
  CANCELLED: { bn: "বাতিল", en: "Cancelled" },
};

export default function OrderStatusBadge({
  status,
  locale,
}: {
  status: OrderStatus;
  locale: string;
}) {
  return (
    <Badge variant={statusVariants[status]}>
      {locale === "bn" ? statusLabels[status].bn : statusLabels[status].en}
    </Badge>
  );
}

"use client";

import {
  Discount,
  useDeleteDiscountMutation,
  useGetDiscountsQuery,
  useToggleDiscountMutation,
} from "@/api/discounts/discountsApi";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import {
  Column,
  QuickAction,
  ReusableTable,
} from "@/components/ui/ReusableTable";
import { toast } from "@/store/toastStore";
import { formatAmount, formatDate, formatNumber } from "@/utils/format";
import { Trash2 } from "lucide-react";
import { useLocale } from "next-intl";

export default function DiscountList() {
  const locale = useLocale();
  const isBn = locale === "bn";

  const { data: discounts = [], isLoading } = useGetDiscountsQuery({});
  const [toggle] = useToggleDiscountMutation();
  const [remove] = useDeleteDiscountMutation();

  const handleToggle = async (id: string) => {
    try {
      await toggle(id).unwrap();
    } catch {
      toast.error("Failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id).unwrap();
      toast.success(isBn ? "মুছে ফেলা হয়েছে" : "Deleted");
    } catch {
      toast.error("Failed");
    }
  };

  const columns: Column<Discount>[] = [
    {
      header: isBn ? "পণ্য" : "Product",
      accessor: d => (
        <div>
          <p className="font-medium text-gray-800">
            {isBn ? d.product_name_bn : d.product_name_en}
          </p>
          <p className="text-xs text-gray-400 font-mono">{d.product_sku}</p>
        </div>
      ),
      exportValue: d => (isBn ? d.product_name_bn : d.product_name_en),
    },
    {
      header: isBn ? "ছাড়" : "Discount",
      accessor: d => (
        <span className="text-sm font-bold text-amber-600">
          {d.discount_type === "PERCENTAGE"
            ? `${formatNumber(d.discount_value, locale)}% ${isBn ? "ছাড়" : "OFF"}`
            : `${formatAmount(d.discount_value, locale, 0)} ${isBn ? "ছাড়" : "OFF"}`}
        </span>
      ),
      exportValue: d =>
        `${d.discount_value}${d.discount_type === "PERCENTAGE" ? "%" : "৳"}`,
    },
    {
      header: isBn ? "নোট" : "Note",
      accessor: d =>
        d.note ? (
          <span className="text-sm text-gray-500">{d.note}</span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
      exportValue: d => d.note,
    },
    {
      header: isBn ? "তারিখ" : "Date",
      accessor: d => (
        <span className="text-xs text-gray-400">
          {formatDate(d.created_at, locale)}
        </span>
      ),
      exportValue: d => new Date(d.created_at).toLocaleDateString(),
    },
    {
      header: isBn ? "স্ট্যাটাস" : "Status",
      accessor: d => (
        <ToggleSwitch
          checked={d.is_active}
          onChange={() => handleToggle(d.id)}
          activeLabel={isBn ? "সক্রিয়" : "Active"}
          inactiveLabel={isBn ? "নিষ্ক্রিয়" : "Inactive"}
        />
      ),
      className: "px-4 py-3 w-36",
    },
  ];

  const quickActions: QuickAction<Discount>[] = [
    {
      label: isBn ? "মুছুন" : "Delete",
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: d => handleDelete(d.id),
      className:
        "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors",
    },
  ];

  return (
    <ReusableTable
      data={discounts}
      columns={columns}
      keyExtractor={d => d.id}
      isLoading={isLoading}
      quickActions={quickActions}
      emptyMessage={isBn ? "কোনো ডিসকাউন্ট নেই" : "No discounts yet"}
      exportFilename="discounts"
    />
  );
}

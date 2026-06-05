"use client";

import PageHeader from "@/components/ui/PageHeader";
import DiscountForm from "@/components/admin/discounts/DiscountForm";
import DiscountList from "@/components/admin/discounts/DiscountList";
import { useLocale } from "next-intl";

export default function DiscountsPage() {
  const locale = useLocale();
  const isBn   = locale === "bn";

  return (
    <div>
      <PageHeader title={isBn ? "ডিসকাউন্ট" : "Discounts"} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DiscountForm />
        <div className="lg:col-span-2">
          <DiscountList />
        </div>
      </div>
    </div>
  );
}

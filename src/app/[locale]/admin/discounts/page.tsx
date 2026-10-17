"use client";

import DiscountForm from "@/components/admin/discounts/DiscountForm";
import DiscountList from "@/components/admin/discounts/DiscountList";
import PageHeader from "@/components/ui/PageHeader";
import { useLocale } from "next-intl";

export default function DiscountsPage() {
  const locale = useLocale();
  const isBn = locale === "bn";

  return (
    <div>
      <PageHeader
        title={isBn ? "ডিসকাউন্ট" : "Discounts"}
        description={isBn ? "পণ্যে শতাংশ বা নির্দিষ্ট পরিমাণ ছাড় যোগ করুন" : "Apply percentage or flat discounts to products"}
      />
      <div className="space-y-6">
        <DiscountForm />
        <DiscountList />
      </div>
    </div>
  );
}

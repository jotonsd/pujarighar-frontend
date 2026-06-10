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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DiscountForm />
        <div className="lg:col-span-2">
          <DiscountList />
        </div>
      </div>
    </div>
  );
}

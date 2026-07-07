"use client";

import { useGetPurchaseReportQuery } from "@/api/reports/reportsApi";
import MovementReportView from "@/components/admin/reports/MovementReportView";

export default function PurchaseReportPage() {
  return (
    <MovementReportView
      titleBn="ক্রয় রিপোর্ট"
      titleEn="Purchase Report"
      descriptionBn="তারিখ, পণ্য বা সরবরাহকারী দিয়ে ক্রয়ের তালিকা দেখুন"
      descriptionEn="View purchases filtered by date, product, or supplier"
      useReportQuery={useGetPurchaseReportQuery}
    />
  );
}

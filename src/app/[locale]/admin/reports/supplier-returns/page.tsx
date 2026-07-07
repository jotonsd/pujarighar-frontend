"use client";

import { useGetSupplierReturnReportQuery } from "@/api/reports/reportsApi";
import MovementReportView from "@/components/admin/reports/MovementReportView";

export default function SupplierReturnReportPage() {
  return (
    <MovementReportView
      titleBn="সরবরাহকারীকে ফেরত রিপোর্ট"
      titleEn="Supplier Return Report"
      descriptionBn="তারিখ, পণ্য বা সরবরাহকারী দিয়ে ফেরতের তালিকা দেখুন"
      descriptionEn="View supplier returns filtered by date, product, or supplier"
      useReportQuery={useGetSupplierReturnReportQuery}
    />
  );
}

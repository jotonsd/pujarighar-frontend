"use client";

import { useGetIncomeReportQuery } from "@/api/reports/reportsApi";
import LedgerReportView from "@/components/admin/reports/LedgerReportView";

export default function IncomeReportPage() {
  return (
    <LedgerReportView
      titleBn="আয় রিপোর্ট"
      titleEn="Income Report"
      descriptionBn="তারিখ বা হিসাব দিয়ে আয়ের তালিকা দেখুন"
      descriptionEn="View income entries filtered by date or account"
      accountType="REVENUE"
      amountColorClass="text-green-600"
      useReportQuery={useGetIncomeReportQuery}
    />
  );
}

"use client";

import { useGetExpenseReportQuery } from "@/api/reports/reportsApi";
import LedgerReportView from "@/components/admin/reports/LedgerReportView";

export default function ExpenseReportPage() {
  return (
    <LedgerReportView
      titleBn="ব্যয় রিপোর্ট"
      titleEn="Expense Report"
      descriptionBn="তারিখ বা হিসাব দিয়ে ব্যয়ের তালিকা দেখুন"
      descriptionEn="View expense entries filtered by date or account"
      accountType="EXPENSE"
      amountColorClass="text-red-600"
      useReportQuery={useGetExpenseReportQuery}
    />
  );
}

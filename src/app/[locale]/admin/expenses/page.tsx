"use client";

import { useGetAccountsQuery, useCreateManualJournalMutation } from "@/api/accounting/accountingApi";
import { useGetExpenseReportQuery } from "@/api/reports/reportsApi";
import { FloatingInput, FloatingSelect, FloatingTextarea } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "@/store/toastStore";
import { formatAmount } from "@/utils/format";
import { useLocale } from "next-intl";
import { useState } from "react";

const PAYMENT_SOURCE_CODES = ["1000", "1050"]; // Cash, Bank Account — see seed_pujarighar.py

export default function AddExpensePage() {
  const locale = useLocale();
  const isBn = locale === "bn";

  const { data: accounts = [] } = useGetAccountsQuery();
  const expenseAccounts = accounts.filter(a => a.account_type === "EXPENSE");
  const paymentSources = accounts.filter(a => PAYMENT_SOURCE_CODES.includes(a.code));

  const [categoryId, setCategoryId] = useState("");
  const [paymentSourceId, setPaymentSourceId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [createExpense, { isLoading }] = useCreateManualJournalMutation();
  const { data: recent, isLoading: recentLoading } = useGetExpenseReportQuery();

  const isValid = !!categoryId && !!paymentSourceId && Number(amount) > 0;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(isBn ? "bn-BD" : "en-US", { day: "numeric", month: "short", year: "numeric" });

  const handleSubmit = async () => {
    const category = expenseAccounts.find(a => a.id === categoryId);
    const source = paymentSources.find(a => a.id === paymentSourceId);
    if (!category || !source) return;

    try {
      await createExpense({
        description_bn: note.trim() || category.name_bn,
        description_en: note.trim() || category.name_en,
        reference_type: "EXPENSE",
        lines: [
          { account_code: category.code, debit: amount, credit: "0", memo_bn: note, memo_en: note },
          { account_code: source.code, debit: "0", credit: amount, memo_bn: note, memo_en: note },
        ],
      }).unwrap();
      toast.success(isBn ? "খরচ যোগ হয়েছে" : "Expense recorded");
      setAmount("");
      setNote("");
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e.data?.message || (isBn ? "ব্যর্থ হয়েছে" : "Failed to record expense"));
    }
  };

  return (
    <div>
      <PageHeader
        title={isBn ? "খরচ যোগ করুন" : "Add Expense"}
        description={isBn ? "কোম্পানির খরচ (ভাড়া, বিদ্যুৎ, বেতন ইত্যাদি) এখানে যোগ করুন" : "Record a company expense — rent, utilities, salary, etc."}
      />

      <div className="card space-y-4 max-w-xl">
        <FloatingSelect
          label={isBn ? "খরচের ধরন" : "Expense Category"}
          value={categoryId}
          onChange={setCategoryId}
          showClearButton={!!categoryId}
          onClear={() => setCategoryId("")}
          options={expenseAccounts.map(a => ({ value: a.id, label: isBn ? a.name_bn : a.name_en }))}
        />
        <FloatingSelect
          label={isBn ? "পরিশোধের উৎস" : "Payment Source"}
          value={paymentSourceId}
          onChange={setPaymentSourceId}
          showClearButton={!!paymentSourceId}
          onClear={() => setPaymentSourceId("")}
          options={paymentSources.map(a => ({ value: a.id, label: isBn ? a.name_bn : a.name_en }))}
        />
        <FloatingInput
          label={isBn ? "পরিমাণ (৳)" : "Amount (৳)"}
          type="number"
          min="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <FloatingTextarea
          label={isBn ? "নোট (ঐচ্ছিক)" : "Note (optional)"}
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
        />
        <button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {isLoading ? (isBn ? "যোগ হচ্ছে..." : "Saving...") : (isBn ? "খরচ যোগ করুন" : "Add Expense")}
        </button>
      </div>

      <h2 className="text-sm font-bold text-gray-700 mt-8 mb-3">{isBn ? "সাম্প্রতিক খরচ" : "Recent Expenses"}</h2>
      {recentLoading ? (
        <p className="text-xs text-gray-400">{isBn ? "লোড হচ্ছে..." : "Loading..."}</p>
      ) : !recent?.rows.length ? (
        <p className="text-sm text-gray-400">{isBn ? "কোনো খরচ নেই" : "No expenses recorded yet"}</p>
      ) : (
        <div className="card p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "তারিখ" : "Date"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "খাত" : "Category"}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "বিবরণ" : "Description"}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-amber-700 uppercase tracking-wider">{isBn ? "পরিমাণ" : "Amount"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.rows.slice(0, 10).map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 text-gray-800">{isBn ? r.account_name_bn : r.account_name_en}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{isBn ? r.description_bn : r.description_en}</td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-red-600">{formatAmount(r.amount, locale, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

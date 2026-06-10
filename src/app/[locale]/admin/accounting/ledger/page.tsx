"use client";
import { formatAmount, formatDate } from "@/utils/format";

import {
  useGetAccountsQuery,
  useGetLedgerQuery,
} from "@/api/accounting/accountingApi";
import { FloatingDatePicker, FloatingSelect } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import type { Column } from "@/components/ui/ReusableTable";
import { ReusableTable } from "@/components/ui/ReusableTable";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

interface LedgerLine {
  date: string;
  entry_number: string;
  description: string;
  debit: string | number;
  credit: string | number;
  balance: string | number;
}

export default function LedgerPage() {
  const t = useTranslations("accounting");
  const locale = useLocale();
  const [accountId, setAccountId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: accounts = [] } = useGetAccountsQuery();
  const { data: ledger, isLoading } = useGetLedgerQuery(
    { accountId, from, to },
    { skip: !accountId },
  );

  const columns: Column<LedgerLine>[] = [
    {
      header: locale === "bn" ? "তারিখ" : "Date",
      accessor: l => (
        <span className="text-gray-500 text-xs">
          {formatDate(l.date, locale)}
        </span>
      ),
      exportValue: l => new Date(l.date).toLocaleDateString(),
    },
    {
      header: locale === "bn" ? "এন্ট্রি" : "Entry",
      accessor: l => (
        <span className="font-mono text-xs">{l.entry_number}</span>
      ),
      exportValue: l => l.entry_number,
    },
    {
      header: locale === "bn" ? "বিবরণ" : "Description",
      accessor: "description",
      className: "px-4 py-3 text-sm text-gray-700",
      exportValue: l => l.description,
    },
    {
      header: t("debit"),
      accessor: l => (
        <span className="text-right block font-bold text-gray-800">
          {Number(l.debit) ? (
            formatAmount(l.debit, locale, 0)
          ) : (
            <span className="text-gray-300 font-normal">—</span>
          )}
        </span>
      ),
      headerClassName:
        "px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider",
      exportValue: l => Number(l.debit) || 0,
    },
    {
      header: t("credit"),
      accessor: l => (
        <span className="text-right block font-bold text-gray-800">
          {Number(l.credit) ? (
            formatAmount(l.credit, locale, 0)
          ) : (
            <span className="text-gray-300 font-normal">—</span>
          )}
        </span>
      ),
      headerClassName:
        "px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider",
      exportValue: l => Number(l.credit) || 0,
    },
    {
      header: t("balance"),
      accessor: l => (
        <span className="text-right block font-bold text-amber-600">
          {formatAmount(l.balance, locale, 0)}
        </span>
      ),
      headerClassName:
        "px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider",
      exportValue: l => Number(l.balance) || 0,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("ledger")}
        description={
          locale === "bn"
            ? "হিসাব খাত নির্বাচন করে বিস্তারিত লেনদেন দেখুন"
            : "Select an account to view its detailed transaction history"
        }
      />
      <div className="flex gap-3 mb-4 flex-wrap items-end">
        <div className="w-72">
          <FloatingSelect
            label={t("account")}
            value={accountId}
            onChange={val => setAccountId(val)}
          >
            <option value="">{t("account")}</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.code} — {locale === "bn" ? a.name_bn : a.name_en}
              </option>
            ))}
          </FloatingSelect>
        </div>
        <div className="w-56">
          <FloatingDatePicker
            label={locale === "bn" ? "শুরু তারিখ" : "From"}
            value={from}
            onChange={setFrom}
            clearable
          />
        </div>
        <div className="w-56">
          <FloatingDatePicker
            label={locale === "bn" ? "শেষ তারিখ" : "To"}
            value={to}
            onChange={setTo}
            clearable
          />
        </div>
      </div>

      {ledger && (
        <div className="flex justify-between  font-bold text-sm text-gray-600 mb-3 px-1">
          <span>
            {locale === "bn" ? "প্রারম্ভিক ব্যালেন্স" : "Opening Balance"}:{" "}
            <strong>{formatAmount(ledger.opening_balance, locale)}</strong>
          </span>
          <span>
            {locale === "bn" ? "সমাপ্তি ব্যালেন্স" : "Closing Balance"}:{" "}
            <strong className="text-amber-600">
              {formatAmount(ledger.closing_balance, locale)}
            </strong>
          </span>
        </div>
      )}

      <ReusableTable
        data={ledger?.lines ?? []}
        columns={columns}
        keyExtractor={l => `${l.entry_number}-${l.date}`}
        isLoading={isLoading && !!accountId}
        exportFilename="ledger"
        emptyMessage={
          accountId
            ? locale === "bn"
              ? "কোনো এন্ট্রি নেই"
              : "No entries found"
            : locale === "bn"
              ? "একটি অ্যাকাউন্ট বেছে নিন"
              : "Select an account to view ledger"
        }
        skeletonRows={6}
      />
    </div>
  );
}

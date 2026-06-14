"use client";

import {
  useGetProductsQuery,
  useUpdateProductMutation,
} from "@/api/products/productsApi";
import Badge from "@/components/ui/Badge";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import PageHeader from "@/components/ui/PageHeader";
import { Column, ReusableTable } from "@/components/ui/ReusableTable";
import { Product } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { formatAmount, formatNumber } from "@/utils/format";
import { Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

export default function PackageList() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isAdmin = useAuthStore(s => s.user?.role === 'ADMIN');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetProductsQuery({
    page,
    is_package: "true",
    include_inactive: true,
  });
  const [updateProduct] = useUpdateProductMutation();

  const handleToggleActive = async (p: Product) => {
    try {
      await updateProduct({ id: p.id, is_active: !p.is_active }).unwrap();
    } catch {
      toast.error(locale === "bn" ? "আপডেট ব্যর্থ" : "Update failed");
    }
  };

  const discountLabel = (p: Product) => {
    if (p.discount_type === "PERCENTAGE")
      return `${formatNumber(p.discount_value, locale)}%`;
    if (p.discount_type === "FLAT")
      return formatAmount(p.discount_value, locale, 0);
    return "—";
  };

  const columns: Column<Product>[] = [
    {
      header: locale === "bn" ? "নাম" : "Name",
      accessor: p => (
        <div>
          <p className="font-medium text-gray-800">
            {locale === "bn" ? p.name_bn : p.name_en}
          </p>
          <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
        </div>
      ),
      exportValue: p => (locale === "bn" ? p.name_bn : p.name_en),
    },
    {
      header: locale === "bn" ? "উপাদান" : "Items",
      accessor: p => (
        <span className="text-sm text-gray-600">
          {formatNumber(p.package_items?.length ?? 0, locale)}{" "}
          {locale === "bn" ? "টি পণ্য" : "products"}
        </span>
      ),
      exportValue: p => p.package_items?.length ?? 0,
    },
    {
      header: locale === "bn" ? "ছাড়" : "Discount",
      accessor: p => (
        <span
          className={`text-sm font-bold ${p.discount_type !== "NONE" ? "text-green-600" : "text-gray-400"}`}
        >
          {discountLabel(p)}
        </span>
      ),
    },
    {
      header: locale === "bn" ? "মূল্য" : "Price",
      accessor: p => (
        <span className="font-bold text-amber-600">
          {formatAmount(p.unit_price, locale, 0)}
        </span>
      ),
      exportValue: p => p.unit_price,
    },
    {
      header: locale === "bn" ? "স্টক" : "Stock",
      accessor: p => (
        <Badge
          className="font-bold"
          variant={Number(p.stock_on_hand) > 0 ? "green" : "red"}
        >
          {formatNumber(Math.round(Number(p.stock_on_hand)), locale)}
        </Badge>
      ),
    },
    {
      header: locale === "bn" ? "স্ট্যাটাস" : "Status",
      accessor: p => isAdmin
        ? <ToggleSwitch checked={p.is_active} onChange={() => handleToggleActive(p)}
            activeLabel={locale === "bn" ? "সক্রিয়" : "Active"} inactiveLabel={locale === "bn" ? "নিষ্ক্রিয়" : "Inactive"} />
        : <Badge variant={p.is_active ? "green" : "red"}>{p.is_active ? (locale === "bn" ? "সক্রিয়" : "Active") : (locale === "bn" ? "নিষ্ক্রিয়" : "Inactive")}</Badge>,
      className: "px-4 py-3 w-36",
    },
  ];

  return (
    <div>
      <PageHeader
        title={locale === "bn" ? "প্যাকেজ" : "Packages"}
        description={
          locale === "bn"
            ? "একাধিক পণ্য নিয়ে তৈরি প্যাকেজ পরিচালনা করুন"
            : "Manage bundles of multiple products"
        }
        {...(isAdmin && { addLabel: locale === "bn" ? "নতুন প্যাকেজ" : "New Package", onAdd: () => router.push(`/${locale}/admin/packages/new`) })}
      />

      <ReusableTable
        data={data?.data ?? []}
        columns={columns}
        keyExtractor={p => p.id}
        isLoading={isLoading}
        totalPages={data?.pagination?.total_pages ?? 1}
        totalRecords={data?.pagination?.total}
        currentPage={page}
        onPageChange={setPage}
        exportFilename="packages"
        emptyMessage={locale === "bn" ? "কোনো প্যাকেজ নেই" : "No packages yet"}
        quickActions={isAdmin ? [
          {
            label: t("common.edit"),
            render: p => (
              <Link
                href={`/${locale}/admin/packages/${p.id}/edit`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                title={t("common.edit")}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Link>
            ),
          },
        ] : []}
      />
    </div>
  );
}

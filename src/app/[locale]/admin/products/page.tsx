"use client";

import {
  useGetProductsQuery,
  useUpdateProductMutation,
} from "@/api/products/productsApi";
import Badge from "@/components/ui/Badge";
import { FloatingInput } from "@/components/ui/forms";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import PageHeader from "@/components/ui/PageHeader";
import type { Column } from "@/components/ui/ReusableTable";
import { ReusableTable } from "@/components/ui/ReusableTable";
import { Product } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { formatAmount } from "@/utils/format";
import { Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminProductsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [limit, setLimit]   = useState(10);

  const { data, isLoading } = useGetProductsQuery({ page, search, page_size: limit, include_inactive: true });
  const [updateProduct] = useUpdateProductMutation();

  const handleToggleActive = async (p: Product) => {
    try {
      await updateProduct({ id: p.id, is_active: !p.is_active }).unwrap();
    } catch {
      toast.error(locale === "bn" ? "আপডেট ব্যর্থ" : "Update failed");
    }
  };

  const columns: Column<Product>[] = [
    {
      header: "SKU",
      accessor: "sku",
      className: "px-4 py-3 text-sm text-gray-500 font-mono",
    },
    {
      header: t("product.name"),
      accessor: p => (
        <span className="text-gray-800 font-medium">
          {locale === "bn" ? p.name_bn : p.name_en}
          {p.is_package && (
            <Badge variant="blue" className="ml-2 text-xs">
              {t("product.package")}
            </Badge>
          )}
        </span>
      ),
    },
    {
      header: t("product.price"),
      accessor: p => (
        <span className="font-semibold text-amber-600">{formatAmount(p.unit_price, locale, 0)}</span>
      ),
      exportValue: p => p.unit_price,
    },
    {
      header: t("product.stock"),
      accessor: p => (
        <Badge variant={Number(p.stock_on_hand) > 0 ? "green" : "red"}>
          {Math.round(Number(p.stock_on_hand))}
        </Badge>
      ),
      exportValue: p => p.stock_on_hand,
    },
    {
      header: locale === "bn" ? "স্ট্যাটাস" : "Status",
      accessor: p => (
        <ToggleSwitch
          checked={p.is_active}
          onChange={() => handleToggleActive(p)}
          activeLabel={locale === "bn" ? "সক্রিয়" : "Active"}
          inactiveLabel={locale === "bn" ? "নিষ্ক্রিয়" : "Inactive"}
        />
      ),
      className: "px-4 py-3 w-36",
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("admin.products")}
        addLabel={t("common.create")}
        onAdd={() => router.push(`/${locale}/admin/products/new`)}
      />

      <div className="mb-4 w-64">
        <FloatingInput
          label={t("common.search")}
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <ReusableTable
        data={data?.data ?? []}
        columns={columns}
        keyExtractor={p => p.id}
        isLoading={isLoading}
        totalPages={data?.pagination?.total_pages ?? 1}
        totalRecords={data?.pagination?.total}
        currentPage={page}
        onPageChange={p => setPage(p)}
        limit={limit}
        onLimitChange={l => { setLimit(l); setPage(1); }}
        exportFilename="products"
        emptyMessage={locale === "bn" ? "কোনো পণ্য নেই" : "No products found"}
        quickActions={[
          {
            label: t("common.edit"),
            render: p => (
              <Link
                href={`/${locale}/admin/products/${p.id}/edit`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                title={t("common.edit")}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}

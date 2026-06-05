"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/ui/PageHeader";
import { Product } from "@/lib/types";
import ProductSelector from "@/components/admin/inventory/ProductSelector";
import StockAdjustPanel from "@/components/admin/inventory/StockAdjustPanel";
import { useLocale } from "next-intl";

export default function InventoryPage() {
  const t      = useTranslations();
  const locale = useLocale();
  const [selected, setSelected] = useState<Product | null>(null);

  return (
    <div>
      <PageHeader title={t("admin.inventory")} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductSelector selected={selected} onSelect={setSelected} />
        {selected ? (
          <StockAdjustPanel product={selected} />
        ) : (
          <div className="card flex items-center justify-center text-gray-400">
            {locale === "bn" ? "একটি পণ্য নির্বাচন করুন" : "Select a product"}
          </div>
        )}
      </div>
    </div>
  );
}

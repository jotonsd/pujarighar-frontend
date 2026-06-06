"use client";

import ProductSelector from "@/components/admin/inventory/ProductSelector";
import StockAdjustPanel from "@/components/admin/inventory/StockAdjustPanel";
import PageHeader from "@/components/ui/PageHeader";
import { Product } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

export default function InventoryPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [selected, setSelected] = useState<Product | null>(null);

  return (
    <div>
      <PageHeader title={t("admin.inventory")} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

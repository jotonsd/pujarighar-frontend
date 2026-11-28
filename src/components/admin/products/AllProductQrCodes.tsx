"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { FloatingInput } from "@/components/ui/forms";
import { useGetProductsQuery } from "@/api/products/productsApi";
import { Product } from "@/lib/types";
import ProductQrCode, { skuQrCode, variantQrCode } from "./ProductQrCode";

interface QrEntry {
  key: string;
  label: string;
  labelEn: string;
  displaySku: string;
  code: string;
}

// One QR per scannable identity, mirroring VariantsPanel.tsx's own logic:
// a variant-bearing product contributes one entry per variant (never one
// for the bare product, which isn't itself a sellable/scannable item once
// it has variants); a simple product contributes exactly one.
function buildEntries(products: Product[], locale: string): QrEntry[] {
  const entries: QrEntry[] = [];
  for (const product of products) {
    if (product.variants.length > 0) {
      for (const variant of product.variants) {
        entries.push({
          key: variant.id,
          label: variant.label_bn || variant.label_en,
          labelEn: `${product.name_en} - ${variant.label_en}`,
          displaySku: variant.sku_suffix ? `${product.sku}-${variant.sku_suffix}` : product.sku,
          code: variantQrCode(variant.id, locale),
        });
      }
    } else {
      entries.push({
        key: product.id,
        label: product.name_bn || product.name_en,
        labelEn: product.name_en,
        displaySku: product.sku,
        code: skuQrCode(product.sku, locale),
      });
    }
  }
  return entries;
}

export default function AllProductQrCodes() {
  const t = useTranslations();
  const locale = useLocale();
  const isBn = locale === "bn";
  const [search, setSearch] = useState("");

  // page_size capped at 1000 server-side (api/utils/pagination.py) — well
  // above any realistic catalog size, so this is a single request, not a
  // paged fetch.
  const { data, isLoading } = useGetProductsQuery({
    search,
    page_size: 1000,
    include_inactive: true,
  });

  const entries = useMemo(() => buildEntries(data?.data ?? [], locale), [data, locale]);

  return (
    <div>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #qr-print-area, #qr-print-area * { visibility: visible; }
          #qr-print-area { position: absolute; inset: 0; }
        }
      `}</style>

      <PageHeader
        title={t("admin.products")}
        description={
          isBn
            ? "সকল পণ্য ও ভ্যারিয়েন্টের QR কোড একসাথে দেখুন ও প্রিন্ট করুন"
            : "View and print QR codes for every product and variant at once"
        }
        showBack
        actions={
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors print:hidden"
          >
            <Printer className="w-3.5 h-3.5" />
            {isBn ? "প্রিন্ট" : "Print"}
          </button>
        }
      />

      <div className="mb-4 max-w-sm print:hidden">
        <FloatingInput
          label={t("common.search")}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted">{isBn ? "লোড হচ্ছে..." : "Loading..."}</div>
      ) : entries.length === 0 ? (
        <div className="text-sm text-muted">{isBn ? "কোনো পণ্য পাওয়া যায়নি" : "No products found"}</div>
      ) : (
        <div
          id="qr-print-area"
          className="flex flex-wrap gap-3 print:gap-2"
        >
          {entries.map(entry => (
            <div key={entry.key} className="print:break-inside-avoid">
              <ProductQrCode
                label={entry.label}
                labelEn={entry.labelEn}
                displaySku={entry.displaySku}
                code={entry.code}
                isBn={isBn}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

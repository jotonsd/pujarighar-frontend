"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { FloatingInput, FloatingSelect } from "@/components/ui/forms";
import { useGetCategoriesQuery } from "@/api/categories/categoriesApi";
import { useGetProductsQuery } from "@/api/products/productsApi";
import { Product } from "@/lib/types";
import { skuQrCode, variantQrCode } from "./ProductQrCode";
import QrStickerCard from "./QrStickerCard";

interface QrEntry {
  key: string;
  labelEn: string;
  displaySku: string;
  code: string;
  // Suggested print quantity — defaults to current stock on hand, since the
  // whole point of this page is one sticker per physical unit sitting in
  // the warehouse. Admin can still override per-entry before printing.
  stock: number;
}

function parseStock(value: string): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

// One QR per scannable identity, mirroring VariantsPanel.tsx's own logic:
// a variant-bearing product contributes one entry per variant (never one
// for the bare product, which isn't itself a sellable/scannable item once
// it has variants); a simple product contributes exactly one. `activeOnly`
// also drops individual inactive variants of an otherwise-active product —
// the product-level `is_active` filter alone wouldn't catch those.
function buildEntries(products: Product[], locale: string, activeOnly: boolean): QrEntry[] {
  const entries: QrEntry[] = [];
  for (const product of products) {
    if (product.variants.length > 0) {
      for (const variant of product.variants) {
        if (activeOnly && !variant.is_active) continue;
        entries.push({
          key: variant.id,
          labelEn: `${product.name_en} - ${variant.label_en}`,
          displaySku: variant.sku_suffix ? `${product.sku}-${variant.sku_suffix}` : product.sku,
          code: variantQrCode(variant.id, locale),
          stock: parseStock(variant.stock_on_hand),
        });
      }
    } else {
      entries.push({
        key: product.id,
        labelEn: product.name_en,
        displaySku: product.sku,
        code: skuQrCode(product.sku, locale),
        stock: parseStock(product.stock_on_hand),
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
  const [category, setCategory] = useState("");
  // Defaults to active-only, matching the expectation that a bulk sticker
  // print run is for what's currently sellable — not every inactive/retired
  // SKU still sitting in the catalog.
  const [status, setStatus] = useState("true");
  const { data: categories = [] } = useGetCategoriesQuery();

  // page_size capped at 1000 server-side (api/utils/pagination.py) — well
  // above any realistic catalog size, so this is a single request, not a
  // paged fetch.
  const { data, isLoading } = useGetProductsQuery({
    search,
    category,
    is_active: status,
    page_size: 1000,
    include_inactive: true,
  });

  const entries = useMemo(
    () => buildEntries(data?.data ?? [], locale, status === "true"),
    [data, locale, status],
  );

  // Per-entry print-quantity overrides, keyed by entry.key — unset entries
  // fall back to their current stock count. Kept separate from `entries` so
  // an edit survives re-filtering/re-fetching as long as the key persists.
  const [quantityOverrides, setQuantityOverrides] = useState<Record<string, number>>({});
  const getQuantity = (entry: QrEntry) => quantityOverrides[entry.key] ?? entry.stock;
  const totalStickers = entries.reduce((sum, e) => sum + getQuantity(e), 0);

  return (
    <div>
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 10mm; }
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

      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
        <div className="col-span-2">
          <FloatingInput
            label={t("common.search")}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <FloatingSelect
          label={isBn ? "কেটাগরি" : "Category"}
          value={category}
          onChange={val => setCategory(val)}
        >
          <option value="">{isBn ? "সব কেটাগরি" : "All Categories"}</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{isBn ? c.name_bn : c.name_en}</option>
          ))}
        </FloatingSelect>
        <FloatingSelect
          label={isBn ? "অবস্থা" : "Status"}
          value={status}
          onChange={val => setStatus(val)}
        >
          <option value="true">{isBn ? "শুধু সক্রিয়" : "Active only"}</option>
          <option value="">{isBn ? "সব" : "All"}</option>
          <option value="false">{isBn ? "নিষ্ক্রিয়" : "Inactive"}</option>
        </FloatingSelect>
      </div>

      {!isLoading && entries.length > 0 && (
        <p className="text-xs text-muted mb-3 print:hidden">
          {isBn
            ? `মোট ${entries.length}টি আইটেম — ${totalStickers}টি স্টিকার প্রিন্ট হবে`
            : `${entries.length} item(s) — ${totalStickers} sticker(s) will print`}
        </p>
      )}

      {isLoading ? (
        <div className="text-sm text-muted">{isBn ? "লোড হচ্ছে..." : "Loading..."}</div>
      ) : entries.length === 0 ? (
        <div className="text-sm text-muted">{isBn ? "কোনো পণ্য পাওয়া যায়নি" : "No products found"}</div>
      ) : (
        <div
          id="qr-print-area"
          className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 print:grid-cols-10 print:gap-2"
        >
          {entries.map(entry => (
            <QrStickerCard
              key={entry.key}
              labelEn={entry.labelEn}
              displaySku={entry.displaySku}
              code={entry.code}
              isBn={isBn}
              quantity={getQuantity(entry)}
              onQuantityChange={next =>
                setQuantityOverrides(prev => ({ ...prev, [entry.key]: next }))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

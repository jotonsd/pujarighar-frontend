"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

// Payload prefixes mirrored exactly from backend/api/views/product_views.py's
// _resolve_qr_code (shared by scan_product and resolve_qr_code) — a
// mismatch here would mean a printed sticker nobody can scan, so these two
// constants are the single source of truth on this side and must stay
// byte-for-byte identical to the backend's.
const QR_SKU_PREFIX = "PG-SKU:";
const QR_VARIANT_PREFIX = "PG-VARIANT:";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";

// One QR per scannable identity — a simple product's own SKU, or one
// specific variant (keyed by the variant's own id, not a made-up SKU
// suffix — see scan_product's docstring for why). Client-side only, same
// `qrcode` package already used for the Play-Store-promo QR elsewhere
// (ShopAppQrCard.tsx/AppPromoBanner.tsx) — generated fresh every time this
// renders, which is fine since the encoded value never changes once a
// product/variant exists.
//
// The QR encodes a real, openable `/qr?code=...` page URL (not the bare
// PG-SKU:/PG-VARIANT: payload by itself) so a plain camera-app scan lands
// on the actual product page instead of just showing unreadable text — see
// src/app/[locale]/qr/page.tsx. The app's own in-app scanner still works
// unchanged: it sends whatever raw text it decoded straight to the backend,
// which strips this URL wrapper back off before matching the prefix (see
// _extract_qr_code).
export default function ProductQrCode({
  label,
  displaySku,
  code,
  isBn,
}: {
  label: string;
  // The human-readable SKU printed under the QR on the sticker — distinct
  // from `code`, which is the full `PG-SKU:`/`PG-VARIANT:` payload actually
  // encoded in the QR image.
  displaySku: string;
  code: string;
  isBn: boolean;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(code, { width: 200, margin: 1, color: { dark: "#1c1917", light: "#ffffff" } })
      .then(url => { if (!cancelled) setDataUrl(url); })
      .catch(() => { if (!cancelled) setDataUrl(null); });
    return () => { cancelled = true; };
  }, [code]);

  return (
    <div className="flex flex-col items-center gap-2 p-3 border border-border rounded-xl bg-background">
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt={label} className="w-28 h-28" />
      ) : (
        <div className="w-28 h-28 rounded-lg bg-surface-alt animate-pulse" />
      )}
      <p className="text-xs font-medium text-body text-center">{label}</p>
      <p className="text-xs font-mono text-muted text-center">{displaySku}</p>
      {dataUrl && (
        <a
          href={dataUrl}
          download={`${displaySku.replace(/[^a-zA-Z0-9-]/g, "_")}.png`}
          className="inline-flex items-center gap-1 text-xs text-amber-700 hover:underline"
        >
          <Download className="w-3 h-3" />
          {isBn ? "ডাউনলোড" : "Download"}
        </a>
      )}
    </div>
  );
}

function qrPageUrl(locale: string, payload: string): string {
  return `${SITE_URL}/${locale}/qr?code=${encodeURIComponent(payload)}`;
}

export function skuQrCode(sku: string, locale: string): string {
  return qrPageUrl(locale, `${QR_SKU_PREFIX}${sku}`);
}

export function variantQrCode(variantId: string, locale: string): string {
  return qrPageUrl(locale, `${QR_VARIANT_PREFIX}${variantId}`);
}

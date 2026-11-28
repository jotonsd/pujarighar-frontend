"use client";

import { Download } from "lucide-react";
import { useQrStickerImage } from "./useQrStickerImage";

// A single printable sticker tile for the bulk QR listing page — the name
// + SKU are baked into the image itself (same composite ProductQrCode.tsx's
// download link produces), so the card shows exactly what gets printed
// instead of a separate on-screen label that could drift from it.
//
// Renders a Fragment (no wrapping element) so this can sit directly inside
// the page's CSS grid: the on-screen review card is one grid cell, and the
// `quantity` print copies are `quantity` more grid cells laid out right
// alongside it — every physical unit in stock gets its own sticker on
// paper, while the screen only ever shows one card per SKU/variant to
// review and adjust the count before printing.
export default function QrStickerCard({
  labelEn,
  displaySku,
  code,
  isBn,
  quantity,
  onQuantityChange,
}: {
  labelEn: string;
  displaySku: string;
  code: string;
  isBn: boolean;
  quantity: number;
  onQuantityChange: (next: number) => void;
}) {
  const stickerUrl = useQrStickerImage(code, labelEn, displaySku);
  const copies = Math.max(0, Math.floor(quantity) || 0);

  return (
    <>
      <div className="flex flex-col items-center gap-1 print:hidden">
        {stickerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stickerUrl} alt={labelEn} className="w-full h-auto border border-border rounded-lg" />
        ) : (
          <div className="w-full aspect-[6/7] rounded-lg bg-surface-alt animate-pulse" />
        )}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] text-muted">{isBn ? "পরিমাণ" : "Qty"}</label>
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={e => onQuantityChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-14 text-xs px-1.5 py-0.5 rounded border border-border bg-background text-body text-center"
          />
        </div>
        {stickerUrl && (
          <a
            href={stickerUrl}
            download={`${displaySku.replace(/[^a-zA-Z0-9-]/g, "_")}.png`}
            className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:underline"
          >
            <Download className="w-3 h-3" />
            {isBn ? "ডাউনলোড" : "Download"}
          </a>
        )}
      </div>
      {stickerUrl && Array.from({ length: copies }).map((_, i) => (
        <div key={i} className="hidden print:block print:break-inside-avoid">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stickerUrl} alt={labelEn} className="w-full h-auto" />
        </div>
      ))}
    </>
  );
}

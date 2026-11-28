"use client";

import { Download } from "lucide-react";
import { useQrStickerImage } from "./useQrStickerImage";

// A single printable sticker tile for the bulk QR listing page — the name
// + SKU are baked into the image itself (same composite ProductQrCode.tsx's
// download link produces), so the card shows exactly what gets printed
// instead of a separate on-screen label that could drift from it.
export default function QrStickerCard({
  labelEn,
  displaySku,
  code,
  isBn,
}: {
  labelEn: string;
  displaySku: string;
  code: string;
  isBn: boolean;
}) {
  const stickerUrl = useQrStickerImage(code, labelEn, displaySku);

  return (
    <div className="flex flex-col items-center gap-1 print:break-inside-avoid">
      {stickerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={stickerUrl} alt={labelEn} className="w-full h-auto border border-border rounded-lg print:border-0 print:rounded-none" />
      ) : (
        <div className="w-full aspect-[6/7] rounded-lg bg-surface-alt animate-pulse" />
      )}
      {stickerUrl && (
        <a
          href={stickerUrl}
          download={`${displaySku.replace(/[^a-zA-Z0-9-]/g, "_")}.png`}
          className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:underline print:hidden"
        >
          <Download className="w-3 h-3" />
          {isBn ? "ডাউনলোড" : "Download"}
        </a>
      )}
    </div>
  );
}

"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

// Shared by ProductQrCode.tsx (single product/variant preview on the edit
// page) and the bulk QR listing page — the bare QR composited with the
// name + SKU baked directly into the image, so a printed sticker is still
// self-explanatory once it's cut away from any on-screen label.
export function useQrStickerImage(code: string, labelEn: string, displaySku: string): string | null {
  const [stickerUrl, setStickerUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(code, { width: 300, margin: 1, color: { dark: "#1c1917", light: "#ffffff" } })
      .then(qrUrl => {
        if (cancelled) return;
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          const canvas = document.createElement("canvas");
          const qrSize = img.width;
          const padding = 24;
          const textBlockHeight = 70;
          canvas.width = qrSize + padding * 2;
          canvas.height = qrSize + padding * 2 + textBlockHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, padding, padding);
          ctx.textAlign = "center";
          ctx.fillStyle = "#1c1917";
          ctx.font = "600 20px sans-serif";
          ctx.fillText(labelEn, canvas.width / 2, padding + qrSize + 32, canvas.width - padding);
          ctx.fillStyle = "#6b7280";
          ctx.font = "16px monospace";
          ctx.fillText(displaySku, canvas.width / 2, padding + qrSize + 58, canvas.width - padding);
          setStickerUrl(canvas.toDataURL("image/png"));
        };
        img.src = qrUrl;
      })
      .catch(() => { if (!cancelled) setStickerUrl(null); });
    return () => { cancelled = true; };
  }, [code, labelEn, displaySku]);

  return stickerUrl;
}

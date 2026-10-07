import { getLocale } from "next-intl/server";
import { PlayCircle } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.pujarighar.pujarighar_app";

// A pure function of constants, generated once per server process instead
// of once per request (this renders on every Shop page load) — see
// AppPromoBanner.tsx for the same pattern.
const qrDataUrlPromise = QRCode.toDataURL(PLAY_STORE_URL, {
  width: 240,
  margin: 1,
  errorCorrectionLevel: "H", // tolerates the center logo overlay below
  color: { dark: "#1c1917", light: "#ffffff" },
});

// Compact "scan to install the app" promo for the Shop page's filter
// sidebar (desktop aside + mobile drawer) — same QR/link as the full
// AppPromoBanner, just sized to sit above a narrow filter panel instead of
// as a full-width hero section.
export default async function ShopAppQrCard() {
  const locale = await getLocale();
  const bn = locale === "bn";
  const qrDataUrl = await qrDataUrlPromise;

  return (
    <div className="relative mb-4 pt-9">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-36 bg-white rounded-2xl border-2 border-amber-500 shadow-md p-2 z-10">
        <div className="relative w-full h-full">
          <Image src={qrDataUrl} alt="" fill unoptimized className="rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden ring-2 ring-white">
              <Image src="/assets/logo/brahman.png" alt="" width={32} height={32} className="w-8 h-8 object-contain" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-900 pt-32 pb-5 px-4 text-center">
        <p className="text-white font-medium text-xs leading-snug mb-3">
          {bn ? "অ্যাপ-এক্সক্লুসিভ আরও অফার পেতে এখনই ডাউনলোড করুন।" : "Download now for more app-exclusive offers."}
        </p>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-white rounded-full px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          {bn ? "প্লে স্টোর" : "Play Store"}
        </a>
      </div>
    </div>
  );
}

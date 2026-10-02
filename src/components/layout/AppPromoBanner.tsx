import { getLocale } from "next-intl/server";
import Image from "next/image";
import QRCode from "qrcode";
import { Smartphone } from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.pujarighar.pujarighar_app";
const APP_PROMO_CODE = "APPNEWU10";

export default async function AppPromoBanner() {
  const locale = await getLocale();
  const bn = locale === "bn";
  const qrDataUrl = await QRCode.toDataURL(PLAY_STORE_URL, {
    width: 260,
    margin: 1,
    color: { dark: "#1c1917", light: "#ffffff" },
  });

  return (
    <section className="bg-background">
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-8 px-6 py-8 sm:px-10 sm:py-10">
            {/* Left: collage of two app screenshots */}
            <div className="shrink-0 hidden sm:block relative w-44 h-52">
              <Image
                src="/assets/app-screens/shop-screenshot.png"
                alt=""
                width={180}
                height={400}
                className="absolute top-0 right-0 w-28 h-auto rounded-xl ring-2 ring-white/30 rotate-6 drop-shadow-[0_12px_16px_rgba(0,0,0,0.55)]"
              />
              <Image
                src="/assets/app-screens/home-screenshot.png"
                alt={bn ? "পূজারিঘর অ্যাপের স্ক্রিনশট" : "PujariGhar app screenshot"}
                width={180}
                height={400}
                className="absolute bottom-0 left-0 w-28 h-auto rounded-xl ring-2 ring-white/30 -rotate-6 drop-shadow-[0_16px_20px_rgba(0,0,0,0.55)]"
              />
            </div>

            {/* Middle: app pitch + promo code */}
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                <Smartphone className="w-3.5 h-3.5" />
                {bn ? "মোবাইল অ্যাপ" : "Mobile App"}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {bn ? "পূজারিঘর অ্যাপ ইনস্টল করুন" : "Install the PujariGhar App"}
              </h2>
              <p className="text-sm sm:text-base text-white/90 mb-4 max-w-md">
                {bn
                  ? "অ্যাপ থেকে প্রথম অর্ডারে ব্যবহার করুন নিচের প্রোমো কোডটি এবং পান ফ্ল্যাট ১০% ছাড়।"
                  : "Use the promo code below on your first app order and get a flat 10% discount."}
              </p>
              <div className="inline-flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 mb-5">
                <span className="text-xs text-muted">{bn ? "প্রোমো কোড" : "Promo code"}</span>
                <span className="font-mono font-bold text-amber-700 tracking-wider">{APP_PROMO_CODE}</span>
                <CopyButton value={APP_PROMO_CODE} isBn={bn} />
              </div>
              <div>
                <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-block">
                  <Image
                    src="/assets/badges/google-play-badge.png"
                    alt={bn ? "গুগল প্লে স্টোরে দেখুন" : "Get it on Google Play"}
                    width={180}
                    height={53}
                    className="h-12 w-auto"
                  />
                </a>
              </div>
            </div>

            {/* Right: QR code */}
            <div className="shrink-0 bg-white rounded-2xl p-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Image src={qrDataUrl} alt="" width={160} height={160} unoptimized className="w-36 h-36 sm:w-40 sm:h-40" />
              <p className="text-xs text-muted mt-2 max-w-[9rem]">
                {bn ? "স্ক্যান করে অ্যাপ ইনস্টল করুন" : "Scan to install the app"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

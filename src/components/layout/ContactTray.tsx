"use client";

import { useGetSiteSettingsQuery } from "@/api/settings/settingsApi";
import { X } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { useState } from "react";

const FACEBOOK_PAGE_ID = "pujarighar";

/** A support agent — person wearing a headset — since lucide only ships bare headphone shapes. */
function SupportAgentIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.13-7 7-7s7 3.1 7 7" />
      <path d="M5.5 8a6.5 6.5 0 0 1 13 0" />
      <rect x="4.2" y="8" width="2.3" height="4" rx="1" />
      <rect x="17.5" y="8" width="2.3" height="4" rx="1" />
      <path d="M18.8 12v1.2a2 2 0 0 1-2 2h-1.3" />
    </svg>
  );
}

function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `880${digits.slice(1)}`;
  return digits;
}

function TrayRow({ href, label, bg, children }: { href: string; label: string; bg: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-green-100/60 transition-colors"
    >
      <span className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${bg}`}>
        {children}
      </span>
      <span className="text-sm font-medium text-green-950">{label}</span>
    </a>
  );
}

export default function ContactTray() {
  const pathname = usePathname();
  const locale = useLocale();
  const isBn = locale === "bn";
  const [open, setOpen] = useState(false);
  const { data: siteSettings } = useGetSiteSettingsQuery();

  const isAdmin = pathname?.split("/")[2] === "admin";
  if (isAdmin) return null;

  const waNumber = siteSettings?.contact_phone ? toWhatsAppNumber(siteSettings.contact_phone) : null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex flex-col items-end gap-3">
      <div
        className={`origin-bottom-right transition-all duration-200 ease-out w-60 bg-green-50 rounded-2xl shadow-2xl border border-green-100 p-2 ${
          open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3 pointer-events-none"
        }`}
      >
        <p className="px-3 pt-2 pb-1.5 text-xs font-semibold text-green-700 uppercase tracking-wide">
          {isBn ? "যোগাযোগ করুন" : "Get in touch"}
        </p>
        <div className="space-y-0.5 pb-1">
          {waNumber && (
            <TrayRow href={`https://wa.me/${waNumber}`} label={isBn ? "হোয়াটসঅ্যাপ" : "WhatsApp"} bg="bg-[#25D366]">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.92 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.81-.78.97-.15.17-.29.19-.53.06-.25-.12-1.05-.39-2-1.23a7.5 7.5 0 0 1-1.38-1.72c-.15-.24-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.24-.87.86-.87 2.09 0 1.23.9 2.42 1.02 2.59.12.17 1.76 2.68 4.26 3.76.6.26 1.06.41 1.43.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.23-.16-.48-.28Z" />
              </svg>
            </TrayRow>
          )}

          <TrayRow href={`https://m.me/${FACEBOOK_PAGE_ID}`} label={isBn ? "মেসেঞ্জার" : "Messenger"} bg="bg-[#0084FF]">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.13 2 11.7c0 3.02 1.34 5.7 3.5 7.53V22l3.2-1.76c.85.24 1.76.36 2.7.36 5.52 0 10-4.13 10-9.7C21.4 6.13 17.52 2 12 2Zm1.03 12.6-2.56-2.73-4.99 2.73 5.49-5.83 2.62 2.73 4.93-2.73-5.49 5.83Z" />
            </svg>
          </TrayRow>

          <TrayRow href={`https://www.facebook.com/${FACEBOOK_PAGE_ID}`} label={isBn ? "ফেসবুক পেজ" : "Facebook Page"} bg="bg-[#1877F2]">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
              <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
            </svg>
          </TrayRow>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title={isBn ? "যোগাযোগ করুন" : "Contact us"}
        aria-label={isBn ? "যোগাযোগ করুন" : "Contact us"}
        className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-green-600 shadow-lg hover:scale-105 hover:bg-green-700 transition-transform"
      >
        {!open && <span className="absolute inset-0 rounded-full bg-green-600 animate-ping opacity-40" />}
        <span className="relative w-5 h-5 sm:w-6 sm:h-6 grid place-items-center">
          <X className={`absolute w-5 h-5 sm:w-6 sm:h-6 text-white transition-all duration-200 ${open ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-45 scale-75"}`} />
          <SupportAgentIcon className={`absolute w-5 h-5 sm:w-6 sm:h-6 text-white transition-all duration-200 ${open ? "opacity-0 rotate-45 scale-75" : "opacity-100 rotate-0 scale-100"}`} />
        </span>
      </button>
    </div>
  );
}

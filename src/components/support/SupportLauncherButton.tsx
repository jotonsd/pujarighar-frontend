"use client";

import { useSupportChatStore } from "@/store/supportChatStore";
import { useLocale } from "next-intl";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function SupportLauncherButton() {
  const pathname = usePathname();
  const locale = useLocale();
  const isBn = locale === "bn";
  const isOpen = useSupportChatStore(s => s.isOpen);
  const open = useSupportChatStore(s => s.open);

  const isAdmin = pathname?.split("/")[2] === "admin";
  if (isAdmin || isOpen) return null;

  return (
    <button
      type="button"
      onClick={open}
      title={isBn ? "ব্রাহ্মণ এআই" : "Brahman AI"}
      aria-label={isBn ? "ব্রাহ্মণ এআই" : "Brahman AI"}
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-lg hover:scale-105 transition-transform"
    >
      <span className="absolute inset-0 rounded-full bg-amber-600 animate-ping opacity-30" />
      <Image
        src="/assets/logo/brahman.png"
        alt={isBn ? "ব্রাহ্মণ এআই" : "Brahman AI"}
        width={56}
        height={56}
        className="relative w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-full"
        priority
      />
    </button>
  );
}

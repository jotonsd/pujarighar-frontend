"use client";

import { useGetActivePromoPopupQuery } from "@/api/promoPopups/promoPopupsApi";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const SEEN_KEY_PREFIX = "promo_popup_seen_";

export default function PromoPopupModal() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const { data: popup } = useGetActivePromoPopupQuery();
  const [open, setOpen] = useState(false);

  // Shown once per popup id, ever — tracked client-side only (no server
  // round-trip needed), so a NEW popup the admin creates shows again even
  // to a visitor who already dismissed a previous one.
  useEffect(() => {
    if (!popup) return;
    try {
      if (!localStorage.getItem(SEEN_KEY_PREFIX + popup.id)) {
        setOpen(true);
      }
    } catch {
      // localStorage unavailable (private mode / blocked) — just show it,
      // worst case it reappears next visit instead of breaking the popup.
      setOpen(true);
    }
  }, [popup]);

  const handleClose = () => {
    setOpen(false);
    if (popup) {
      try {
        localStorage.setItem(SEEN_KEY_PREFIX + popup.id, "1");
      } catch {
        // Ignore — nothing to persist, popup just shows again next visit.
      }
    }
  };

  if (!open || !popup || !popup.image) return null;

  const image = (
    <Image
      src={popup.image}
      alt={isBn ? "প্রোমোশন" : "Promotion"}
      width={popup.image_width || 800}
      height={popup.image_height || 800}
      className="w-full h-auto rounded-2xl"
      priority
    />
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label={isBn ? "বন্ধ করুন" : "Close"}
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white text-body shadow-lg flex items-center justify-center hover:bg-surface-alt transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        {popup.link ? (
          <Link href={popup.link} onClick={handleClose}>
            {image}
          </Link>
        ) : (
          image
        )}
      </div>
    </div>
  );
}

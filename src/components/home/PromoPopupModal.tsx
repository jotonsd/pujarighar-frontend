"use client";

import { useGetActivePromoPopupQuery } from "@/api/promoPopups/promoPopupsApi";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const SEEN_KEY_PREFIX = "promo_popup_seen_";

// Local calendar date (not UTC) — "today" should match the visitor's own
// day boundary, not a server/UTC one.
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PromoPopupModal() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const { data: popup } = useGetActivePromoPopupQuery();
  const [open, setOpen] = useState(false);

  // Shown on every page, once per popup per calendar day — closing it
  // suppresses it for the rest of today, but it comes back tomorrow (and
  // immediately for a NEW popup the admin creates, since the key is scoped
  // to that popup's own id). Tracked client-side only (localStorage), no
  // server round-trip needed.
  useEffect(() => {
    if (!popup) return;
    try {
      if (localStorage.getItem(SEEN_KEY_PREFIX + popup.id) !== todayKey()) {
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
        localStorage.setItem(SEEN_KEY_PREFIX + popup.id, todayKey());
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
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white text-gray-800 shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
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

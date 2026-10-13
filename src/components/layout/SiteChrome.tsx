"use client";

import { usePathname } from "next/navigation";
import Toaster from "@/components/ui/Toaster";
import SupportLauncherButton from "@/components/support/SupportLauncherButton";
import SupportChatWidget from "@/components/support/SupportChatWidget";
import PromoPopupModal from "@/components/home/PromoPopupModal";

// Staff-facing areas (admin panel, the delivery-person app view) and the
// maintenance screen never show the customer promo popup — only real
// storefront visitors should see it.
const NO_POPUP_SEGMENTS = ["admin", "delivery", "maintenance"];

export default function SiteChrome({
  navbar,
  footer,
  children,
}: {
  navbar: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const segment = pathname?.split("/")[2];
  const isMaintenance = segment === "maintenance";
  const showPopup = !NO_POPUP_SEGMENTS.includes(segment ?? "");

  if (isMaintenance) {
    return (
      <>
        {children}
        <Toaster />
        <SupportLauncherButton />
        <SupportChatWidget />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {showPopup && <PromoPopupModal />}
      {navbar}
      <main className="flex-1">{children}</main>
      {footer}
      <Toaster />
      <SupportLauncherButton />
      <SupportChatWidget />
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import Toaster from "@/components/ui/Toaster";
import WhatsAppBubble from "@/components/layout/WhatsAppBubble";

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
  const isMaintenance = pathname?.split("/")[2] === "maintenance";

  if (isMaintenance) {
    return (
      <>
        {children}
        <Toaster />
        <WhatsAppBubble />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {navbar}
      <main className="flex-1">{children}</main>
      {footer}
      <Toaster />
      <WhatsAppBubble />
    </div>
  );
}

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Providers from "@/components/layout/Providers";
import SiteChrome from "@/components/layout/SiteChrome";
import { locales } from "@/lib/i18n";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Arimo, Hind_Siliguri } from "next/font/google";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// English UI font
const arimo = Arimo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Bengali UI font — self-hosted via next/font instead of a render-blocking
// @import, so it no longer sits in the critical request chain.
const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "পূজারিঘর | PujariGhar",
  icons: { icon: "/assets/logo/favicon.png" },
};

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as "bn" | "en")) notFound();

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={locale === "en" ? arimo.className : hindSiliguri.className}>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <SiteChrome navbar={<Suspense><Navbar /></Suspense>} footer={<Footer />}>
              {children}
            </SiteChrome>
          </Providers>
        </NextIntlClientProvider>
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}

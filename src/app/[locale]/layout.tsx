import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Providers from "@/components/layout/Providers";
import SiteChrome from "@/components/layout/SiteChrome";
import { locales } from "@/lib/i18n";
import { getOrganizationSchema } from "@/lib/structuredData";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Poppins, Hind_Siliguri } from "next/font/google";
import { notFound } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";

interface SiteSettingData {
  company_name_bn: string;
  company_name_en: string;
  contact_phone: string;
  contact_email: string;
  address_bn: string;
  address_en: string;
  logo: string | null;
}

async function fetchSettings(): Promise<SiteSettingData | null> {
  try {
    const res = await fetch(`${API_ORIGIN}/api/settings/`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

// English UI font
const poppins = Poppins({
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

  const [messages, settings] = await Promise.all([getMessages(), fetchSettings()]);

  const organizationSchema = settings
    ? getOrganizationSchema(settings, locale === "bn", SITE_URL)
    : null;

  return (
    <html lang={locale} className={locale === "en" ? poppins.className : hindSiliguri.className}>
      <head>
        <link rel="preconnect" href={API_ORIGIN} />
        <link rel="dns-prefetch" href={API_ORIGIN} />
        {organizationSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
          />
        )}
      </head>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <SiteChrome navbar={<Navbar />} footer={<Footer />}>
              {children}
            </SiteChrome>
          </Providers>
        </NextIntlClientProvider>
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}

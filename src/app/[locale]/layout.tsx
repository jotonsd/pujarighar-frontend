import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Providers from "@/components/layout/Providers";
import SiteChrome from "@/components/layout/SiteChrome";
import { locales } from "@/lib/i18n";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Roboto_Condensed } from "next/font/google";
import { notFound } from "next/navigation";

// English UI font
const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "পূজারিঘর | PujariGhar",
  icons: { icon: "/assets/logo/favicon.png" },
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as "bn" | "en")) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} className={locale === "en" ? robotoCondensed.className : ""}>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <SiteChrome navbar={<Navbar />} footer={<Footer />}>
              {children}
            </SiteChrome>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

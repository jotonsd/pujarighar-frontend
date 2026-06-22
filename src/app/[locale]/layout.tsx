import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Providers from "@/components/layout/Providers";
import SiteChrome from "@/components/layout/SiteChrome";
import { locales } from "@/lib/i18n";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";

// Configure Inter for premium e-commerce readability
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Added '600' (semi-bold) as it is widely used for product pricing and card titles
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
    <html lang={locale} className={locale === "en" ? inter.className : ""}>
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

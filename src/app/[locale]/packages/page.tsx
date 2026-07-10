import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import PackagesPageClient from "./PackagesPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isBn = locale === "bn";
  return {
    title: isBn ? "পূজার প্যাকেজ | PujariGhar" : "Puja Packages | PujariGhar",
    description: isBn
      ? "পূজারিঘরের সম্পূর্ণ পূজার প্যাকেজ দেখুন — এক জায়গায় সব প্রয়োজনীয় সামগ্রী।"
      : "Browse complete puja packages from PujariGhar — all essentials bundled in one place.",
    alternates: {
      canonical: `${SITE_URL}/${locale}/packages`,
      languages: {
        bn: `${SITE_URL}/bn/packages`,
        en: `${SITE_URL}/en/packages`,
      },
    },
  };
}

export default function PackagesPage() {
  return <PackagesPageClient />;
}

import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import ProductsPageClient from "./ProductsPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isBn = locale === "bn";
  return {
    title: isBn ? "সকল পণ্য | PujariGhar" : "All Products | PujariGhar",
    description: isBn
      ? "পূজারিঘরের সকল পূজার সামগ্রী দেখুন ও ফিল্টার করুন — মূল্য, কেটাগরি ও ব্র্যান্ড অনুযায়ী।"
      : "Browse and filter all puja items from PujariGhar by price, category, and brand.",
    alternates: {
      canonical: `${SITE_URL}/${locale}/products`,
      languages: {
        bn: `${SITE_URL}/bn/products`,
        en: `${SITE_URL}/en/products`,
      },
    },
  };
}

export default function ProductsPage() {
  return <ProductsPageClient />;
}

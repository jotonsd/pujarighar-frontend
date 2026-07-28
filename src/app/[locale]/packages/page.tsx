import OfferBanners from "@/components/products/OfferBanners";
import type { Metadata } from "next";
import PackagesPageClient from "./PackagesPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";

interface Props {
  params: { locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = params.locale;
  const isBn = locale === "bn";
  return {
    title: isBn ? "পূজার প্যাকেজ | PujariGhar" : "Puja Packages in Bangladesh | PujariGhar",
    description: isBn
      ? "বাংলাদেশে পূজার প্যাকেজ কিনুন পূজারিঘর থেকে — এক জায়গায় সব প্রয়োজনীয় পূজার সামগ্রী বান্ডিল করা।"
      : "Buy puja packages in Bangladesh from PujariGhar — complete pooja samagri bundles with all essentials in one place.",
    keywords: isBn
      ? ["পূজার প্যাকেজ", "পূজারিঘর", "বাংলাদেশে পূজার সামগ্রী", "পূজার বান্ডিল"]
      : ["puja package", "pujarighar", "puja items in bangladesh", "pooja samagri bundle"],
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
  return <PackagesPageClient offerBanners={<OfferBanners />} />;
}

import OfferBanners from "@/components/products/OfferBanners";
import type { Metadata } from "next";
import TrackOrderClient from "./TrackOrderClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";

interface Props {
  params: { locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = params.locale;
  const isBn = locale === "bn";
  return {
    title: isBn ? "অর্ডার ট্র্যাক করুন | PujariGhar" : "Track Your Order | PujariGhar",
    alternates: {
      canonical: `${SITE_URL}/${locale}/track`,
      languages: {
        bn: `${SITE_URL}/bn/track`,
        en: `${SITE_URL}/en/track`,
      },
    },
  };
}

export default function TrackOrderPage() {
  return <TrackOrderClient offerBanners={<OfferBanners />} />;
}

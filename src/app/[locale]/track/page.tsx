import OfferBanners from "@/components/products/OfferBanners";
import type { Metadata } from "next";
import TrackOrderClient from "./TrackOrderClient";

// Uses useSearchParams (order_number/phone prefill from shared tracking links) client-side — keep dynamic to avoid a static-export CSR bailout.
export const dynamic = "force-dynamic";

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

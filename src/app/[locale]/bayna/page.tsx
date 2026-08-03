import type { Metadata } from "next";
import BaynaClient from "./BaynaClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";

interface Props {
  params: { locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = params.locale;
  const isBn = locale === "bn";
  return {
    title: isBn ? "বায়না দিন | PujariGhar" : "Book a Service | PujariGhar",
    description: isBn
      ? "পূজারী, ঢাকি অথবা মূর্তির জন্য বায়না দিন — আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।"
      : "Request a Pujari, Dhaki, or custom Murti — we'll contact you shortly to confirm the details.",
    alternates: {
      canonical: `${SITE_URL}/${locale}/bayna`,
      languages: {
        bn: `${SITE_URL}/bn/bayna`,
        en: `${SITE_URL}/en/bayna`,
      },
    },
  };
}

export default function BaynaPage() {
  return <BaynaClient />;
}

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { MapPin } from "lucide-react";
import BangladeshMap from "./BangladeshMap";
import { DIVISIONS, DHAKA_DIVISION, DISTRICT_BN, DIVISION_BN } from "@/data/bdDistrictNames";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";

interface Props {
  params: { locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const isBn = params.locale === "bn";
  return {
    title: isBn ? "ডেলিভারি এলাকা | পূজারিঘর" : "Delivery Area | PujariGhar",
    description: isBn
      ? "পূজারিঘর ঢাকাসহ বাংলাদেশের সব ৮টি বিভাগ ও ৬৪টি জেলায় ডেলিভারি প্রদান করে।"
      : "PujariGhar delivers to Dhaka and all 8 divisions and 64 districts across Bangladesh.",
    alternates: {
      canonical: `${SITE_URL}/${params.locale}/delivery-area`,
      languages: {
        bn: `${SITE_URL}/bn/delivery-area`,
        en: `${SITE_URL}/en/delivery-area`,
      },
    },
  };
}

export default function DeliveryAreaPage({ params }: Props) {
  const locale = params.locale;
  setRequestLocale(locale);
  const isBn = locale === "bn";
  const totalDistricts = DHAKA_DIVISION.districts_bn.length + DIVISIONS.reduce((n, d) => n + d.districts_bn.length, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-10">
      <div className="text-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-body mb-1.5">
          {isBn ? "আমাদের ডেলিভারি এলাকা" : "Our Delivery Area"}
        </h1>
        <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto leading-relaxed">
          {isBn
            ? `ঢাকা থেকে শুরু করে বাংলাদেশের সব ${totalDistricts}টি জেলাতেই আমরা পূজার সামগ্রী পৌঁছে দিই।`
            : `From Dhaka to every one of Bangladesh's ${totalDistricts} districts, we deliver puja essentials nationwide.`}
        </p>
      </div>

      <BangladeshMap isBn={isBn} districtBn={DISTRICT_BN} divisionBn={DIVISION_BN} />

      {/* District directory, grouped by division — Dhaka first (the hub) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {[DHAKA_DIVISION, ...DIVISIONS].map(d => (
          <div key={d.name_en} className="card">
            <h2 className="font-semibold text-body mb-2.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
              {isBn ? d.name_bn : d.name_en}
              {" "}
              <span className="text-xs font-normal text-muted">
                ({isBn ? `${d.districts_bn.length}টি জেলা` : `${d.districts_en.length} districts`})
              </span>
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {(isBn ? d.districts_bn : d.districts_en).map(name => (
                <span key={name} className="text-xs px-2 py-1 rounded-full bg-surface-alt text-muted">
                  {name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted text-center mt-8">
        {isBn
          ? "নির্দিষ্ট এলাকার ডেলিভারি চার্জ ও সময়সীমা চেকআউট পেজে দেখানো হয়।"
          : "Exact delivery charges and timelines for your area are shown at checkout."}
      </p>
    </div>
  );
}

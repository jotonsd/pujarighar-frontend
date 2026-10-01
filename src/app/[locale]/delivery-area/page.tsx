import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { MapPin } from "lucide-react";
import BangladeshMap from "./BangladeshMap";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";

interface Props {
  params: { locale: string };
}

interface Division {
  name_bn: string;
  name_en: string;
  districts_bn: string[];
  districts_en: string[];
}

const DIVISIONS: Division[] = [
  {
    name_bn: "চট্টগ্রাম",
    name_en: "Chattogram",
    districts_bn: ["বান্দরবান", "ব্রাহ্মণবাড়িয়া", "চাঁদপুর", "চট্টগ্রাম", "কুমিল্লা", "কক্সবাজার", "ফেনী", "খাগড়াছড়ি", "লক্ষ্মীপুর", "নোয়াখালী", "রাঙামাটি"],
    districts_en: ["Bandarban", "Brahmanbaria", "Chandpur", "Chattogram", "Cumilla", "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati"],
  },
  {
    name_bn: "রাজশাহী",
    name_en: "Rajshahi",
    districts_bn: ["বগুড়া", "জয়পুরহাট", "নওগাঁ", "নাটোর", "চাঁপাইনবাবগঞ্জ", "পাবনা", "রাজশাহী", "সিরাজগঞ্জ"],
    districts_en: ["Bogura", "Joypurhat", "Naogaon", "Natore", "Chapainawabganj", "Pabna", "Rajshahi", "Sirajganj"],
  },
  {
    name_bn: "খুলনা",
    name_en: "Khulna",
    districts_bn: ["বাগেরহাট", "চুয়াডাঙ্গা", "যশোর", "ঝিনাইদহ", "খুলনা", "কুষ্টিয়া", "মাগুরা", "মেহেরপুর", "নড়াইল", "সাতক্ষীরা"],
    districts_en: ["Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"],
  },
  {
    name_bn: "বরিশাল",
    name_en: "Barishal",
    districts_bn: ["বরগুনা", "বরিশাল", "ভোলা", "ঝালকাঠি", "পটুয়াখালী", "পিরোজপুর"],
    districts_en: ["Barguna", "Barishal", "Bhola", "Jhalokathi", "Patuakhali", "Pirojpur"],
  },
  {
    name_bn: "সিলেট",
    name_en: "Sylhet",
    districts_bn: ["হবিগঞ্জ", "মৌলভীবাজার", "সুনামগঞ্জ", "সিলেট"],
    districts_en: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"],
  },
  {
    name_bn: "রংপুর",
    name_en: "Rangpur",
    districts_bn: ["দিনাজপুর", "গাইবান্ধা", "কুড়িগ্রাম", "লালমনিরহাট", "নীলফামারী", "পঞ্চগড়", "রংপুর", "ঠাকুরগাঁও"],
    districts_en: ["Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon"],
  },
  {
    name_bn: "ময়মনসিংহ",
    name_en: "Mymensingh",
    districts_bn: ["জামালপুর", "ময়মনসিংহ", "নেত্রকোণা", "শেরপুর"],
    districts_en: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"],
  },
];

// Dhaka's own districts — shown as a labeled card like the other divisions.
const DHAKA_DIVISION = {
  name_bn: "ঢাকা",
  name_en: "Dhaka",
  districts_bn: ["ঢাকা", "ফরিদপুর", "গাজীপুর", "গোপালগঞ্জ", "কিশোরগঞ্জ", "মাদারীপুর", "মানিকগঞ্জ", "মুন্সিগঞ্জ", "নারায়ণগঞ্জ", "নরসিংদী", "রাজবাড়ী", "শরীয়তপুর", "টাঙ্গাইল"],
  districts_en: ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"],
};

// normalize() only strips case/punctuation — it can't fix actual spelling
// differences. The official OCHA/BBS boundary dataset uses a few spellings
// that genuinely differ from the ones we display in the district directory
// (which keep the more standard English spelling), so those need an
// explicit alias from the dataset's spelling to ours, or the Bengali
// label/tooltip silently falls back to showing the English name instead.
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
const DISTRICT_NAME_ALIASES: Record<string, string> = {
  chapainababganj: "Chapainawabganj",
  netrakona: "Netrokona",
  jhalokati: "Jhalokathi",
};

function buildBnLookup() {
  const districtBn: Record<string, string> = {};
  const divisionBn: Record<string, string> = {};
  for (const d of [DHAKA_DIVISION, ...DIVISIONS]) {
    divisionBn[normalize(d.name_en)] = d.name_bn;
    d.districts_en.forEach((en, i) => {
      districtBn[normalize(en)] = d.districts_bn[i];
    });
  }
  for (const [officialSpelling, ourSpelling] of Object.entries(DISTRICT_NAME_ALIASES)) {
    const bn = districtBn[normalize(ourSpelling)];
    if (bn) districtBn[officialSpelling] = bn;
  }
  return { districtBn, divisionBn };
}
const { districtBn: DISTRICT_BN, divisionBn: DIVISION_BN } = buildBnLookup();

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

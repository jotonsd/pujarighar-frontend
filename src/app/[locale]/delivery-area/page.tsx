import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { MapPin } from "lucide-react";
import DeliveryChargesPreview from "./DeliveryChargesPreview";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";

interface Props {
  params: { locale: string };
}

interface Division {
  name_bn: string;
  name_en: string;
  districts_bn: string[];
  districts_en: string[];
  // Rough placement on the stylized map (percent of width/height) — not
  // geographically precise, just enough to spread the division pins out
  // recognizably (Sylhet to the northeast, Chattogram to the southeast,
  // Khulna/Barishal to the south/southwest, etc.).
  pin: { top: string; left: string };
}

const DIVISIONS: Division[] = [
  {
    name_bn: "ঢাকা",
    name_en: "Dhaka",
    districts_bn: ["ঢাকা", "ফরিদপুর", "গাজীপুর", "গোপালগঞ্জ", "কিশোরগঞ্জ", "মাদারীপুর", "মানিকগঞ্জ", "মুন্সিগঞ্জ", "নারায়ণগঞ্জ", "নরসিংদী", "রাজবাড়ী", "শরীয়তপুর", "টাঙ্গাইল"],
    districts_en: ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"],
    pin: { top: "46%", left: "48%" },
  },
  {
    name_bn: "চট্টগ্রাম",
    name_en: "Chattogram",
    districts_bn: ["বান্দরবান", "ব্রাহ্মণবাড়িয়া", "চাঁদপুর", "চট্টগ্রাম", "কুমিল্লা", "কক্সবাজার", "ফেনী", "খাগড়াছড়ি", "লক্ষ্মীপুর", "নোয়াখালী", "রাঙামাটি"],
    districts_en: ["Bandarban", "Brahmanbaria", "Chandpur", "Chattogram", "Cumilla", "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati"],
    pin: { top: "62%", left: "68%" },
  },
  {
    name_bn: "রাজশাহী",
    name_en: "Rajshahi",
    districts_bn: ["বগুড়া", "জয়পুরহাট", "নওগাঁ", "নাটোর", "চাঁপাইনবাবগঞ্জ", "পাবনা", "রাজশাহী", "সিরাজগঞ্জ"],
    districts_en: ["Bogura", "Joypurhat", "Naogaon", "Natore", "Chapainawabganj", "Pabna", "Rajshahi", "Sirajganj"],
    pin: { top: "33%", left: "28%" },
  },
  {
    name_bn: "খুলনা",
    name_en: "Khulna",
    districts_bn: ["বাগেরহাট", "চুয়াডাঙ্গা", "যশোর", "ঝিনাইদহ", "খুলনা", "কুষ্টিয়া", "মাগুরা", "মেহেরপুর", "নড়াইল", "সাতক্ষীরা"],
    districts_en: ["Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"],
    pin: { top: "66%", left: "26%" },
  },
  {
    name_bn: "বরিশাল",
    name_en: "Barishal",
    districts_bn: ["বরগুনা", "বরিশাল", "ভোলা", "ঝালকাঠি", "পটুয়াখালী", "পিরোজপুর"],
    districts_en: ["Barguna", "Barishal", "Bhola", "Jhalokathi", "Patuakhali", "Pirojpur"],
    pin: { top: "70%", left: "46%" },
  },
  {
    name_bn: "সিলেট",
    name_en: "Sylhet",
    districts_bn: ["হবিগঞ্জ", "মৌলভীবাজার", "সুনামগঞ্জ", "সিলেট"],
    districts_en: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"],
    pin: { top: "28%", left: "72%" },
  },
  {
    name_bn: "রংপুর",
    name_en: "Rangpur",
    districts_bn: ["দিনাজপুর", "গাইবান্ধা", "কুড়িগ্রাম", "লালমনিরহাট", "নীলফামারী", "পঞ্চগড়", "রংপুর", "ঠাকুরগাঁও"],
    districts_en: ["Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon"],
    pin: { top: "12%", left: "30%" },
  },
  {
    name_bn: "ময়মনসিংহ",
    name_en: "Mymensingh",
    districts_bn: ["জামালপুর", "ময়মনসিংহ", "নেত্রকোণা", "শেরপুর"],
    districts_en: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"],
    pin: { top: "26%", left: "50%" },
  },
];

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
  const totalDistricts = DIVISIONS.reduce((n, d) => n + d.districts_bn.length, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-body mb-3">
          {isBn ? "আমাদের ডেলিভারি এলাকা" : "Our Delivery Area"}
        </h1>
        <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto leading-relaxed">
          {isBn
            ? `ঢাকা থেকে শুরু করে বাংলাদেশের সব ${totalDistricts}টি জেলাতেই আমরা পূজার সামগ্রী পৌঁছে দিই — ঢাকার ভিতরে দ্রুততম ডেলিভারি, আর দেশের প্রতিটি প্রান্তে নির্ভরযোগ্য সেবা।`
            : `From Dhaka to every one of Bangladesh's ${totalDistricts} districts — fastest delivery inside Dhaka, reliable service everywhere else in the country.`}
        </p>
      </div>

      <DeliveryChargesPreview locale={locale} isBn={isBn} />

      {/* Stylized coverage map — Dhaka at the hub, the other 7 divisions
          as surrounding pins. Not a geographically precise map, just a
          clean illustration of nationwide coverage. */}
      <div className="relative mx-auto mb-12 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-border overflow-hidden" style={{ aspectRatio: "4 / 5", maxWidth: 420 }}>
        <svg viewBox="0 0 100 125" className="absolute inset-0 w-full h-full" aria-hidden="true">
          <path
            d="M50 4
               C 62 4, 70 10, 74 20
               C 78 30, 76 38, 82 46
               C 90 56, 88 68, 80 76
               C 74 83, 76 90, 68 98
               C 60 108, 62 116, 50 120
               C 38 116, 40 108, 32 98
               C 24 90, 26 83, 20 76
               C 12 68, 10 56, 18 46
               C 24 38, 22 30, 26 20
               C 30 10, 38 4, 50 4 Z"
            className="fill-amber-200/50 dark:fill-amber-800/20 stroke-amber-400 dark:stroke-amber-700"
            strokeWidth="1"
          />
        </svg>
        {DIVISIONS.map(d => (
          <div
            key={d.name_en}
            className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center"
            style={{ top: d.pin.top, left: d.pin.left }}
          >
            <span className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap mb-0.5 px-1.5 py-0.5 rounded-full ${
              d.name_en === "Dhaka"
                ? "bg-amber-600 text-white"
                : "bg-surface text-body border border-border"
            }`}>
              {isBn ? d.name_bn : d.name_en}
            </span>
            <MapPin
              className={d.name_en === "Dhaka" ? "w-5 h-5 text-amber-600" : "w-3.5 h-3.5 text-amber-500"}
              fill="currentColor"
              strokeWidth={1}
            />
          </div>
        ))}
      </div>

      {/* District directory, grouped by division */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {DIVISIONS.map(d => (
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

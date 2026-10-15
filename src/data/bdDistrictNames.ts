// Shared Bangladesh division/district bn<->en directory — single source of
// truth for both the /delivery-area page and DeliveryRouteMap, so the two
// don't drift into separately-maintained copies of the same 64 names.

export interface Division {
  name_bn: string;
  name_en: string;
  districts_bn: string[];
  districts_en: string[];
}

export const DIVISIONS: Division[] = [
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
export const DHAKA_DIVISION: Division = {
  name_bn: "ঢাকা",
  name_en: "Dhaka",
  districts_bn: ["ঢাকা", "ফরিদপুর", "গাজীপুর", "গোপালগঞ্জ", "কিশোরগঞ্জ", "মাদারীপুর", "মানিকগঞ্জ", "মুন্সিগঞ্জ", "নারায়ণগঞ্জ", "নরসিংদী", "রাজবাড়ী", "শরীয়তপুর", "টাঙ্গাইল"],
  districts_en: ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"],
};

// normalize() only strips case/punctuation — it can't fix actual spelling
// differences. The official OCHA/BBS boundary dataset (bdDistrictsMap.json)
// uses a few spellings that genuinely differ from the ones we display here
// (the more standard English spelling), so those need an explicit alias
// from the dataset's spelling to ours, or the Bengali label/tooltip
// silently falls back to showing the English name instead.
export const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
export const DISTRICT_NAME_ALIASES: Record<string, string> = {
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

export const { districtBn: DISTRICT_BN, divisionBn: DIVISION_BN } = buildBnLookup();

// Reverse of DISTRICT_BN — a Bengali district name (as typed by a customer
// or admin, e.g. "ঝিনাইদহ") back to its standard English spelling. Bengali
// has no case and normalize() only strips a-z, so this is keyed by the
// Bengali string as-is (just trimmed), not run through normalize().
export const DISTRICT_EN_BY_BN: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const d of [DHAKA_DIVISION, ...DIVISIONS]) {
    d.districts_bn.forEach((bn, i) => {
      out[bn.trim()] = d.districts_en[i];
    });
  }
  return out;
})();

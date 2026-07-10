import HeroSlider from "@/components/home/HeroSlider";
import HomeCategoryProducts from "@/components/home/HomeCategoryProducts";
import HomeOffers from "@/components/home/HomeOffers";
import HomePackages from "@/components/home/HomePackages";
import RecommendedForYou from "@/components/home/RecommendedForYou";
import OfferBanners from "@/components/products/OfferBanners";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";

interface Props {
  params: { locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = params.locale;
  const isBn = locale === "bn";
  const title = isBn
    ? "পূজারিঘর | অনলাইনে পূজার সামগ্রী কিনুন"
    : "PujariGhar | Buy Puja Items Online in Bangladesh";
  const description = isBn
    ? "পূজারিঘর থেকে প্রামাণিক পূজার সামগ্রী, প্যাকেজ ও সামগ্রী অনলাইনে অর্ডার করুন। দ্রুত ডেলিভারি ও বিশ্বস্ত সেবা।"
    : "Order authentic puja items, packages, and accessories online from PujariGhar. Fast delivery and trusted service across Bangladesh.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        bn: `${SITE_URL}/bn`,
        en: `${SITE_URL}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      type: "website",
    },
  };
}

export default async function HomePage({ params }: Props) {
  const locale = params.locale;
  setRequestLocale(locale);

  const features = [
    {
      icon: "🪔",
      title_bn: "প্রামাণিক পণ্য",
      title_en: "Authentic Products",
      desc_bn: "বিশুদ্ধ ও মানসম্পন্ন পূজার সামগ্রী",
      desc_en: "Pure and quality puja items",
    },
    {
      icon: "🚚",
      title_bn: "দ্রুত ডেলিভারি",
      title_en: "Fast Delivery",
      desc_bn: "দরজায় পৌঁছে দেই",
      desc_en: "Delivered to your doorstep",
    },
    {
      icon: "🙏",
      title_bn: "বিশ্বস্ত সেবা",
      title_en: "Trusted Service",
      desc_bn: "গ্রাহক সন্তুষ্টি আমাদের লক্ষ্য",
      desc_en: "Customer satisfaction is our goal",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Packages */}
      <HomePackages />

      {/* Offer Banners */}
      <OfferBanners />

      {/* Offers — discounted products */}
      <HomeOffers />

      {/* Recommended for you — personalized by view/search history */}
      <RecommendedForYou />

      {/* Products — category-wise, top 12 by sales */}
      <HomeCategoryProducts />

      {/* Authentic products section */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-5 text-center">
          {locale === "bn" ? "কেন পূজারিঘর?" : "Why PujariGhar?"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="card text-center">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-2">
                {locale === "bn" ? f.title_bn : f.title_en}
              </h3>
              <p className="text-gray-500 text-sm">
                {locale === "bn" ? f.desc_bn : f.desc_en}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

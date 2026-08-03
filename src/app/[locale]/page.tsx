import HeroSlider from "@/components/home/HeroSlider";
import HomeCategoryProducts from "@/components/home/HomeCategoryProducts";
import HomeOffers from "@/components/home/HomeOffers";
import HomePackages from "@/components/home/HomePackages";
import RecommendedForYou from "@/components/home/RecommendedForYou";
import OfferBanners from "@/components/products/OfferBanners";
import { BadgeCheck, HeartHandshake, Truck } from "lucide-react";
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
    ? "পূজারিঘর | বাংলাদেশে অনলাইনে পূজার সামগ্রী কিনুন"
    : "PujariGhar | Buy Puja Items in Bangladesh Online";
  const description = isBn
    ? "বাংলাদেশে পূজার সামগ্রী কিনুন পূজারিঘর থেকে — প্রামাণিক পূজার জিনিসপত্র, পূজার প্যাকেজ ও আনুষঙ্গিক সামগ্রী অনলাইনে অর্ডার করুন। ঢাকাসহ সারা বাংলাদেশে দ্রুত ডেলিভারি ও বিশ্বস্ত সেবা।"
    : "Buy puja items in Bangladesh online from PujariGhar — your trusted pooja ghar for authentic puja samagri, packages, and accessories. Fast delivery and reliable service nationwide.";
  const keywords = isBn
    ? [
        "পূজার সামগ্রী",
        "পূজারিঘর",
        "বাংলাদেশে পূজার সামগ্রী",
        "পূজার জিনিসপত্র",
        "পূজার প্যাকেজ",
        "অনলাইনে পূজার সামগ্রী",
        "দুর্গা পূজার সামগ্রী",
        "পূজা সামগ্রী ঢাকা",
      ]
    : [
        "puja items",
        "pujarighar",
        "puja items in bangladesh",
        "pooja samagri",
        "puja package",
        "buy puja items online",
        "durga puja items",
        "pooja items dhaka",
      ];

  return {
    title,
    description,
    keywords,
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
      icon: BadgeCheck,
      title_bn: "প্রামাণিক পণ্য",
      title_en: "Authentic Products",
      desc_bn: "বিশুদ্ধ ও মানসম্পন্ন পূজার সামগ্রী",
      desc_en: "Pure and quality puja items",
    },
    {
      icon: Truck,
      title_bn: "দ্রুত ডেলিভারি",
      title_en: "Fast Delivery",
      desc_bn: "দরজায় পৌঁছে দেই",
      desc_en: "Delivered to your doorstep",
    },
    {
      icon: HeartHandshake,
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

      {/* Recommended for you — personalized by view/search history */}
      <RecommendedForYou />

      {/* Offer Banners */}
      <OfferBanners />

      {/* Offers — discounted products */}
      <HomeOffers />

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
              <f.icon className="w-10 h-10 mx-auto mb-4 text-amber-600" />
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

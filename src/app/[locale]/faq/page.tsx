import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getFAQPageSchema } from "@/lib/structuredData";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";

interface Props {
  params: { locale: string };
}

const FAQS = [
  {
    question_bn: "পূজারিঘর কী?",
    question_en: "What is PujariGhar?",
    answer_bn: "পূজারিঘর একটি অনলাইন প্ল্যাটফর্ম যেখানে আপনি প্রামাণিক পূজার সামগ্রী, প্যাকেজ ও আনুষঙ্গিক জিনিসপত্র ঘরে বসেই অর্ডার করতে পারবেন — এক জায়গা থেকে সব ধরনের পূজার প্রয়োজনীয় উপকরণ।",
    answer_en: "PujariGhar is an online platform where you can order authentic puja items, packages, and accessories from the comfort of your home — everything you need for your puja rituals in one place.",
  },
  {
    question_bn: "কেন পূজারিঘর থেকে কিনবেন?",
    question_en: "Why buy from PujariGhar?",
    answer_bn: "আমরা যাচাইকৃত সরবরাহকারীদের থেকে মানসম্পন্ন পূজার সামগ্রী সংগ্রহ করি, প্রতিটি পণ্যের মান নিশ্চিত করি এবং দ্রুত, নির্ভরযোগ্য ডেলিভারি প্রদান করি — যাতে আপনি নিশ্চিন্তে পূজার প্রস্তুতি নিতে পারেন।",
    answer_en: "We source quality puja items from verified suppliers, quality-check every product, and offer fast, reliable delivery — so you can prepare for your puja with peace of mind.",
  },
  {
    question_bn: "পূজারিঘর কোথায় ডেলিভারি দেয়?",
    question_en: "Where does PujariGhar deliver?",
    answer_bn: "আমরা ঢাকাসহ সমগ্র বাংলাদেশে ডেলিভারি প্রদান করি।",
    answer_en: "We deliver across the whole of Bangladesh, including Dhaka.",
  },
  {
    question_bn: "কীভাবে অর্ডার করবো?",
    question_en: "How do I place an order?",
    answer_bn: "পছন্দের পণ্য কার্টে যোগ করুন, তারপর চেকআউট পেজে গিয়ে ডেলিভারি ঠিকানা ও পেমেন্ট মাধ্যম নির্বাচন করে অর্ডার নিশ্চিত করুন।",
    answer_en: "Add your desired items to the cart, then go to checkout, select your delivery address and payment method, and confirm the order.",
  },
  {
    question_bn: "ডেলিভারি পেতে কত সময় লাগে?",
    question_en: "How long does delivery take?",
    answer_bn: "ঢাকার ভিতরে সাধারণত ২-৫ কার্যদিবস এবং ঢাকার বাইরে ৩-৭ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়।",
    answer_en: "Delivery usually takes 2-5 business days inside Dhaka and 3-7 business days outside Dhaka.",
  },
  {
    question_bn: "কী কী পেমেন্ট মাধ্যম গ্রহণযোগ্য?",
    question_en: "What payment methods are accepted?",
    answer_bn: "ক্যাশ অন ডেলিভারি (COD) এবং মোবাইল ব্যাংকিং/অনলাইন পেমেন্ট উভয় মাধ্যমেই পেমেন্ট করা যায়।",
    answer_en: "You can pay via Cash on Delivery (COD) or online payment/mobile banking.",
  },
  {
    question_bn: "পণ্য কি ফেরত দেওয়া যায়?",
    question_en: "Can I return a product?",
    answer_bn: "ডেলিভারির পর ২৪ ঘণ্টার মধ্যে ক্ষতিগ্রস্ত, ভুল বা ত্রুটিপূর্ণ পণ্যের জন্য রিটার্ন গ্রহণ করা হয়। বিস্তারিত জানতে আমাদের রিটার্ন নীতি দেখুন।",
    answer_en: "Returns are accepted within 24 hours of delivery for damaged, incorrect, or defective items. See our Return Policy page for details.",
  },
  {
    question_bn: "পূজারিঘরের পণ্যগুলো কি প্রামাণিক?",
    question_en: "Are PujariGhar's products authentic?",
    answer_bn: "হ্যাঁ, আমাদের প্রতিটি পণ্য যাচাই করা সরবরাহকারীদের থেকে সংগ্রহ করা হয় এবং মান নিশ্চিত করেই তালিকাভুক্ত করা হয়।",
    answer_en: "Yes, every product is sourced from verified suppliers and quality-checked before being listed.",
  },
  {
    question_bn: "অর্ডার ট্র্যাক করবো কীভাবে?",
    question_en: "How do I track my order?",
    answer_bn: "আমাদের ওয়েবসাইটের 'অর্ডার ট্র্যাক' পেজে আপনার অর্ডার নম্বর দিয়ে সহজেই বর্তমান অবস্থা জানতে পারবেন।",
    answer_en: "Use the 'Track Order' page on our website with your order number to check the current status anytime.",
  },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const isBn = params.locale === "bn";
  return {
    title: isBn ? "সচরাচর জিজ্ঞাসা | পূজারিঘর" : "Frequently Asked Questions | PujariGhar",
    description: isBn
      ? "অর্ডার, ডেলিভারি, পেমেন্ট ও রিটার্ন সম্পর্কে পূজারিঘরের সচরাচর জিজ্ঞাসিত প্রশ্নের উত্তর।"
      : "Answers to frequently asked questions about ordering, delivery, payment, and returns at PujariGhar.",
    alternates: {
      canonical: `${SITE_URL}/${params.locale}/faq`,
      languages: {
        bn: `${SITE_URL}/bn/faq`,
        en: `${SITE_URL}/en/faq`,
      },
    },
  };
}

export default async function FaqPage({ params }: Props) {
  const locale = params.locale;
  setRequestLocale(locale);
  const isBn = locale === "bn";

  const jsonLd = getFAQPageSchema(FAQS, isBn);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
        {isBn ? "সচরাচর জিজ্ঞাসা" : "Frequently Asked Questions"}
      </h1>

      <div className="space-y-3">
        {FAQS.map((faq, i) => (
          <details key={i} className="rounded-xl border border-gray-100 bg-white p-4 group shadow-sm">
            <summary className="font-medium text-gray-800 cursor-pointer select-none">
              {isBn ? faq.question_bn : faq.question_en}
            </summary>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              {isBn ? faq.answer_bn : faq.answer_en}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

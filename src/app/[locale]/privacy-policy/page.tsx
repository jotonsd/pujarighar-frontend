import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";

interface Props {
  params: { locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = params.locale;
  const isBn = locale === "bn";
  return {
    title: isBn ? "গোপনীয়তা নীতি | PujariGhar" : "Privacy Policy | PujariGhar",
    alternates: {
      canonical: `${SITE_URL}/${locale}/privacy-policy`,
      languages: {
        bn: `${SITE_URL}/bn/privacy-policy`,
        en: `${SITE_URL}/en/privacy-policy`,
      },
    },
  };
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const locale = params.locale;
  setRequestLocale(locale);
  const isBn = locale === "bn";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
        {isBn ? "গোপনীয়তা নীতি" : "Privacy Policy"}
      </h1>

      <div className="space-y-6 text-sm sm:text-base text-gray-600 leading-relaxed">
        <p>
          {isBn
            ? "পূজারিঘর (PujariGhar) আপনার ব্যক্তিগত তথ্যের গোপনীয়তা রক্ষায় প্রতিশ্রুতিবদ্ধ। এই নীতিতে আমরা কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার এবং সংরক্ষণ করি তা ব্যাখ্যা করা হয়েছে।"
            : "PujariGhar is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information."}
        </p>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "আমরা যে তথ্য সংগ্রহ করি" : "Information We Collect"}
          </h2>
          <p>
            {isBn
              ? "অর্ডার দেওয়ার সময় আমরা আপনার নাম, ফোন নম্বর, ডেলিভারি ঠিকানা এবং ইমেইল (যদি প্রদান করেন) সংগ্রহ করি। পেমেন্ট তথ্য সরাসরি আমাদের নিরাপদ পেমেন্ট পার্টনারের মাধ্যমে প্রক্রিয়া করা হয় এবং আমরা কার্ড নম্বর সংরক্ষণ করি না।"
              : "When you place an order, we collect your name, phone number, delivery address, and email (if provided). Payment details are processed directly through our secure payment partners — we do not store card numbers."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "তথ্যের ব্যবহার" : "How We Use Your Information"}
          </h2>
          <p>
            {isBn
              ? "আপনার তথ্য অর্ডার প্রক্রিয়াকরণ, ডেলিভারি সমন্বয়, গ্রাহক সহায়তা প্রদান এবং আপনার অনুমতি থাকলে প্রমোশনাল আপডেট পাঠানোর জন্য ব্যবহার করা হয়। আমরা আপনার তথ্য তৃতীয় পক্ষের কাছে বিক্রি করি না।"
              : "Your information is used to process orders, coordinate delivery, provide customer support, and — with your consent — send promotional updates. We do not sell your information to third parties."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "তথ্যের সুরক্ষা" : "Data Security"}
          </h2>
          <p>
            {isBn
              ? "আমরা আপনার তথ্যের অনুমোদনহীন অ্যাক্সেস, পরিবর্তন বা প্রকাশ রোধ করতে যুক্তিসঙ্গত প্রযুক্তিগত ও প্রশাসনিক সুরক্ষা ব্যবস্থা গ্রহণ করি।"
              : "We implement reasonable technical and administrative safeguards to protect your information from unauthorized access, alteration, or disclosure."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "আপনার অধিকার" : "Your Rights"}
          </h2>
          <p>
            {isBn
              ? "আপনি যেকোনো সময় আমাদের সাথে যোগাযোগ করে আপনার সংরক্ষিত তথ্য দেখতে, সংশোধন করতে বা মুছে ফেলার অনুরোধ করতে পারেন।"
              : "You may contact us at any time to view, correct, or request deletion of the personal information we hold about you."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "যোগাযোগ" : "Contact Us"}
          </h2>
          <p>
            {isBn
              ? "এই নীতি সম্পর্কে কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন: support@pujarighar.com"
              : "If you have any questions about this policy, please contact us at support@pujarighar.com."}
          </p>
        </section>
      </div>
    </div>
  );
}

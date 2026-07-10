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
    title: isBn ? "রিটার্ন নীতি | PujariGhar" : "Return Policy | PujariGhar",
    alternates: {
      canonical: `${SITE_URL}/${locale}/return-policy`,
      languages: {
        bn: `${SITE_URL}/bn/return-policy`,
        en: `${SITE_URL}/en/return-policy`,
      },
    },
  };
}

export default async function ReturnPolicyPage({ params }: Props) {
  const locale = params.locale;
  setRequestLocale(locale);
  const isBn = locale === "bn";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
        {isBn ? "রিটার্ন নীতি" : "Return Policy"}
      </h1>

      <div className="space-y-6 text-sm sm:text-base text-gray-600 leading-relaxed">
        <p>
          {isBn
            ? "আমরা চাই আপনি আমাদের পণ্যে সম্পূর্ণ সন্তুষ্ট হন। যদি কোনো সমস্যা থাকে, নিচের নীতি অনুসরণ করে রিটার্ন বা প্রতিস্থাপনের ব্যবস্থা করা যাবে।"
            : "We want you to be fully satisfied with your purchase. If there's an issue, returns or replacements can be arranged according to the policy below."}
        </p>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "রিটার্নের শর্ত" : "Eligibility for Return"}
          </h2>
          <p>
            {isBn
              ? "ডেলিভারির পর ২৪ ঘণ্টার মধ্যে ক্ষতিগ্রস্ত, ভুল বা ত্রুটিপূর্ণ পণ্যের জন্য রিটার্ন গ্রহণ করা হয়। পণ্যটি অব্যবহৃত, মূল প্যাকেজিং সহ এবং ক্রয়ের প্রমাণ (অর্ডার নম্বর) থাকতে হবে।"
              : "Returns are accepted within 24 hours of delivery for damaged, incorrect, or defective items. The item must be unused, in its original packaging, with proof of purchase (order number)."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "যেসব পণ্য রিটার্ন করা যায় না" : "Non-Returnable Items"}
          </h2>
          <p>
            {isBn
              ? "ব্যবহৃত পূজার সামগ্রী, প্রসাদ বা পচনশীল পণ্য, এবং কাস্টমাইজড/বিশেষ অর্ডার করা পণ্য রিটার্নের আওতার বাইরে।"
              : "Used puja items, prasad or perishable goods, and customized/special-order items are not eligible for return."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "রিটার্ন প্রক্রিয়া" : "How to Request a Return"}
          </h2>
          <p>
            {isBn
              ? "রিটার্নের জন্য অর্ডার নম্বর সহ আমাদের গ্রাহক সেবার সাথে যোগাযোগ করুন। আমাদের একজন প্রতিনিধি পণ্যটি যাচাই করে পিকআপ বা প্রতিস্থাপনের ব্যবস্থা করবেন।"
              : "Contact our customer support with your order number to request a return. A representative will verify the item and arrange pickup or replacement."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "রিফান্ড" : "Refunds"}
          </h2>
          <p>
            {isBn
              ? "অনুমোদিত রিটার্নের জন্য, ক্যাশ অন ডেলিভারি অর্ডারে রিফান্ড মোবাইল ব্যাংকিংয়ের মাধ্যমে এবং অনলাইন পেমেন্টের ক্ষেত্রে মূল পেমেন্ট মাধ্যমে ৫-৭ কার্যদিবসের মধ্যে প্রদান করা হবে।"
              : "For approved returns, refunds for Cash on Delivery orders are issued via mobile banking, and online payments are refunded to the original payment method within 5-7 business days."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "যোগাযোগ" : "Contact Us"}
          </h2>
          <p>
            {isBn
              ? "রিটার্ন সংক্রান্ত কোনো প্রশ্নের জন্য আমাদের সাথে যোগাযোগ করুন: support@pujarighar.com"
              : "For any return-related questions, please contact us at support@pujarighar.com."}
          </p>
        </section>
      </div>
    </div>
  );
}

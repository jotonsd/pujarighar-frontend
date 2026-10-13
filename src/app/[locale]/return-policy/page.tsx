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
    title: isBn ? "রিটার্ন ও এক্সচেঞ্জ নীতি | PujariGhar" : "Return & Exchange Policy | PujariGhar",
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
      <h1 className="text-2xl sm:text-3xl font-bold text-body mb-6">
        {isBn ? "রিটার্ন ও এক্সচেঞ্জ নীতি" : "Return & Exchange Policy"}
      </h1>

      <div className="space-y-6 text-sm sm:text-base text-muted leading-relaxed">
        <p>
          {isBn
            ? "আমরা চাই আপনি আমাদের পণ্যে সম্পূর্ণ সন্তুষ্ট হন। যদি কোনো সমস্যা থাকে, নিচের নীতি অনুসরণ করে রিটার্ন বা এক্সচেঞ্জের ব্যবস্থা করা যাবে।"
            : "We want you to be fully satisfied with your purchase. If there's an issue, a return or exchange can be arranged according to the policy below."}
        </p>

        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-4 py-3">
          <p className="font-semibold text-red-700 dark:text-red-400">
            {isBn
              ? "গুরুত্বপূর্ণ নোট: ছাড়কৃত (ডিসকাউন্টেড) পণ্য রিফান্ড বা রিটার্নযোগ্য নয়।"
              : "Important Note: Discounted products are not eligible for refund or return."}
          </p>
        </div>

        {/* ── Return Policy ─────────────────────────────────────────── */}
        <div className="pt-2">
          <h2 className="text-xl font-bold text-green-800 mb-4 pb-2 border-b border-border">
            {isBn ? "রিটার্ন নীতি" : "Return Policy"}
          </h2>

          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-body mb-2">
                {isBn ? "রিটার্নের শর্ত" : "Eligibility for Return"}
              </h3>
              <p>
                {isBn
                  ? "ডেলিভারি গ্রহণের সময় পণ্যটি অবশ্যই ভালোভাবে যাচাই করে নিতে হবে। পণ্য ক্ষতিগ্রস্ত, ভুল বা ত্রুটিপূর্ণ হলে তা ডেলিভারি গ্রহণের সময়ই আমাদের জানাতে হবে — ডেলিভারি সম্পন্ন/গ্রহণ হয়ে যাওয়ার পর আর কোনো রিটার্ন গ্রহণযোগ্য নয়। পণ্যটি অব্যবহৃত, মূল প্যাকেজিং সহ এবং ক্রয়ের প্রমাণ (অর্ডার নম্বর) থাকতে হবে।"
                  : "Please inspect your order carefully at the time of delivery. Any damage, incorrect item, or defect must be reported to us right then, at the moment of delivery — once delivery has been accepted/completed, no return will be accepted afterward. The item must be unused, in its original packaging, with proof of purchase (order number)."}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-body mb-2">
                {isBn ? "যেসব পণ্য রিটার্ন করা যায় না" : "Non-Returnable Items"}
              </h3>
              <p>
                {isBn
                  ? "ব্যবহৃত পূজার সামগ্রী, প্রসাদ বা পচনশীল পণ্য, এবং কাস্টমাইজড/বিশেষ অর্ডার করা পণ্য রিটার্নের আওতার বাইরে।"
                  : "Used puja items, prasad or perishable goods, and customized/special-order items are not eligible for return."}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-body mb-2">
                {isBn ? "রিটার্ন প্রক্রিয়া" : "How to Request a Return"}
              </h3>
              <p>
                {isBn
                  ? "রিটার্নের জন্য অর্ডার নম্বর সহ আমাদের গ্রাহক সেবার সাথে যোগাযোগ করুন। আমাদের একজন প্রতিনিধি পণ্যটি যাচাই করে পিকআপ বা প্রতিস্থাপনের ব্যবস্থা করবেন।"
                  : "Contact our customer support with your order number to request a return. A representative will verify the item and arrange pickup or replacement."}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-body mb-2">
                {isBn ? "ডেলিভারি চার্জ" : "Delivery Charge"}
              </h3>
              <p>
                {isBn
                  ? "রিটার্নের ক্ষেত্রে পণ্যটি আমাদের কাছে ফেরত পাঠানোর ডেলিভারি চার্জ গ্রাহককে বহন করতে হবে।"
                  : "For returns, the delivery charge for sending the item back to us must be covered by the customer."}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-body mb-2">
                {isBn ? "রিফান্ড" : "Refunds"}
              </h3>
              <p>
                {isBn
                  ? "অনুমোদিত রিটার্নের জন্য, ক্যাশ অন ডেলিভারি অর্ডারে রিফান্ড মোবাইল ব্যাংকিংয়ের মাধ্যমে এবং অনলাইন পেমেন্টের ক্ষেত্রে মূল পেমেন্ট মাধ্যমে ৫-৭ কার্যদিবসের মধ্যে প্রদান করা হবে।"
                  : "For approved returns, refunds for Cash on Delivery orders are issued via mobile banking, and online payments are refunded to the original payment method within 5-7 business days."}
              </p>
            </section>
          </div>
        </div>

        {/* ── Exchange Policy ───────────────────────────────────────── */}
        <div className="pt-2">
          <h2 className="text-xl font-bold text-green-800 mb-4 pb-2 border-b border-border">
            {isBn ? "এক্সচেঞ্জ নীতি" : "Exchange Policy"}
          </h2>

          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-body mb-2">
                {isBn ? "এক্সচেঞ্জের শর্ত" : "Eligibility for Exchange"}
              </h3>
              <p>
                {isBn
                  ? "ভুল সাইজ, রঙ বা ভ্যারিয়েন্ট পাঠানো হলে, অথবা পণ্যটি ক্ষতিগ্রস্ত বা ত্রুটিপূর্ণ হলে এক্সচেঞ্জের জন্য অনুরোধ করা যাবে। পণ্যটি অব্যবহৃত, মূল প্যাকেজিং সহ এবং ক্রয়ের প্রমাণ (অর্ডার নম্বর) থাকতে হবে, এবং বিষয়টি ডেলিভারি গ্রহণের সময়ই আমাদের জানাতে হবে। স্টক সাপেক্ষে একই পণ্যের ভিন্ন সাইজ/রঙ, অথবা সমমূল্যের অন্য একটি পণ্যের সাথে প্রতিস্থাপন করা হবে।"
                  : "You may request an exchange if you received the wrong size, color, or variant, or if the item is damaged or defective. The item must be unused, in its original packaging, with proof of purchase (order number), and the issue must be reported to us at the time of delivery. Subject to stock availability, we'll replace it with a different size/color of the same item, or another item of equal value."}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-body mb-2">
                {isBn ? "এক্সচেঞ্জ প্রক্রিয়া" : "How to Request an Exchange"}
              </h3>
              <p>
                {isBn
                  ? "এক্সচেঞ্জের জন্য অর্ডার নম্বর সহ আমাদের গ্রাহক সেবার সাথে যোগাযোগ করুন। আমাদের একজন প্রতিনিধি পণ্যটি যাচাই করে পিকআপ এবং নতুন পণ্য পাঠানোর ব্যবস্থা করবেন।"
                  : "Contact our customer support with your order number to request an exchange. A representative will verify the item and arrange pickup along with sending the replacement."}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-body mb-2">
                {isBn ? "ডেলিভারি চার্জ" : "Delivery Charge"}
              </h3>
              <p>
                {isBn
                  ? "এক্সচেঞ্জের ক্ষেত্রে পণ্যটি আমাদের কাছে ফেরত পাঠানোর ডেলিভারি চার্জ গ্রাহককে বহন করতে হবে।"
                  : "For exchanges, the delivery charge for sending the item back to us must be covered by the customer."}
              </p>
            </section>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-body mb-2">
            {isBn ? "যোগাযোগ" : "Contact Us"}
          </h2>
          <p>
            {isBn
              ? "রিটার্ন বা এক্সচেঞ্জ সংক্রান্ত কোনো প্রশ্নের জন্য আমাদের সাথে যোগাযোগ করুন: pujarigharbd@gmail.com"
              : "For any return or exchange related questions, please contact us at pujarigharbd@gmail.com."}
          </p>
        </section>
      </div>
    </div>
  );
}

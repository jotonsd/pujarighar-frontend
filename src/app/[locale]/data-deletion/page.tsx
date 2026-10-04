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
    title: isBn ? "ডেটা মুছে ফেলার নির্দেশনা | PujariGhar" : "Data Deletion Instructions | PujariGhar",
    alternates: {
      canonical: `${SITE_URL}/${locale}/data-deletion`,
      languages: {
        bn: `${SITE_URL}/bn/data-deletion`,
        en: `${SITE_URL}/en/data-deletion`,
      },
    },
  };
}

export default async function DataDeletionPage({ params }: Props) {
  const locale = params.locale;
  setRequestLocale(locale);
  const isBn = locale === "bn";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-body mb-6">
        {isBn ? "ডেটা মুছে ফেলার নির্দেশনা" : "Data Deletion Instructions"}
      </h1>

      <div className="space-y-6 text-sm sm:text-base text-muted leading-relaxed">
        <p>
          {isBn
            ? "আপনি যদি Google বা Facebook দিয়ে পূজারিঘর অ্যাকাউন্টে প্রবেশ করে থাকেন এবং আপনার অ্যাকাউন্ট ও সংশ্লিষ্ট সকল তথ্য মুছে ফেলতে চান, তাহলে নিচের ধাপগুলো অনুসরণ করুন।"
            : "If you've signed into PujariGhar using Google or Facebook and want your account and all associated data permanently deleted, follow the steps below."}
        </p>

        <section>
          <h2 className="text-lg font-semibold text-body mb-2">
            {isBn ? "কীভাবে অনুরোধ করবেন" : "How to Request Deletion"}
          </h2>
          <p className="mb-2">
            {isBn
              ? "আমাদের নিচের ইমেইল ঠিকানায় একটি বার্তা পাঠান, যেখানে উল্লেখ থাকবে:"
              : "Send us an email at the address below, including:"}
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              {isBn
                ? "আপনার নিবন্ধিত ইমেইল অথবা ফোন নম্বর"
                : "Your registered email address or phone number"}
            </li>
            <li>
              {isBn
                ? "বিষয়ে লিখুন: \"অ্যাকাউন্ট ও ডেটা মুছে ফেলার অনুরোধ\""
                : "Subject line: \"Account and Data Deletion Request\""}
            </li>
          </ul>
          <p className="mt-3">
            {isBn ? "ইমেইল করুন: " : "Email us at: "}
            <a href="mailto:pujarigharbd@gmail.com" className="text-amber-700 dark:text-amber-400 font-medium hover:underline">
              pujarigharbd@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-body mb-2">
            {isBn ? "কী মুছে ফেলা হবে" : "What Gets Deleted"}
          </h2>
          <p>
            {isBn
              ? "যাচাইয়ের পর আমরা আপনার অ্যাকাউন্টের প্রোফাইল তথ্য (নাম, ছবি, ঠিকানা) স্থায়ীভাবে মুছে ফেলব এবং আপনার অ্যাকাউন্টটি নিষ্ক্রিয় করে দেব। আইন অনুযায়ী সংরক্ষণ প্রয়োজনীয় অর্ডার ও লেনদেনের হিসাব সংক্রান্ত রেকর্ড (যেমন ইনভয়েস) একটি নির্দিষ্ট সময়ের জন্য সংরক্ষিত থাকতে পারে, পরিচয়বিহীন করে।"
              : "After verification, we will permanently delete your profile information (name, picture, address) and deactivate your account. Order and accounting records we're legally required to retain (such as invoices) may be kept for a limited period in anonymized form."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-body mb-2">
            {isBn ? "প্রক্রিয়াকরণের সময়" : "Processing Time"}
          </h2>
          <p>
            {isBn
              ? "আমরা সাধারণত ৭ কার্যদিবসের মধ্যে আপনার অনুরোধ প্রক্রিয়া করি এবং সম্পন্ন হলে আপনাকে ইমেইলের মাধ্যমে নিশ্চিত করি।"
              : "We typically process deletion requests within 7 business days and will confirm by email once complete."}
          </p>
        </section>
      </div>
    </div>
  );
}

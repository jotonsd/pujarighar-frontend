import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";
const SUPPORT_EMAIL = "pujarigharbd@gmail.com";

interface Props {
  params: { locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = params.locale;
  const isBn = locale === "bn";
  return {
    title: isBn ? "অ্যাকাউন্ট মুছে ফেলুন | PujariGhar" : "Delete Account | PujariGhar",
    alternates: {
      canonical: `${SITE_URL}/${locale}/delete-account`,
      languages: {
        bn: `${SITE_URL}/bn/delete-account`,
        en: `${SITE_URL}/en/delete-account`,
      },
    },
  };
}

export default async function DeleteAccountPage({ params }: Props) {
  const locale = params.locale;
  setRequestLocale(locale);
  const isBn = locale === "bn";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
        {isBn ? "পূজারিঘর — অ্যাকাউন্ট ও তথ্য মুছে ফেলুন" : "PujariGhar — Delete Your Account & Data"}
      </h1>

      <div className="space-y-6 text-sm sm:text-base text-gray-600 leading-relaxed">
        <p>
          {isBn
            ? "আপনি যদি আপনার পূজারিঘর অ্যাকাউন্ট এবং সংশ্লিষ্ট ব্যক্তিগত তথ্য মুছে ফেলতে চান, নিচের নির্দেশনা অনুসরণ করুন।"
            : "If you'd like to delete your PujariGhar account and the personal data associated with it, follow the steps below."}
        </p>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "কীভাবে অনুরোধ করবেন" : "How to Request Deletion"}
          </h2>
          <p>
            {isBn ? (
              <>
                আমাদের সাপোর্ট ইমেইলে লিখুন{" "}
                <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("অ্যাকাউন্ট মুছে ফেলার অনুরোধ")}`} className="text-amber-700 underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                — বিষয়ে লিখুন &ldquo;অ্যাকাউন্ট মুছে ফেলার অনুরোধ&rdquo; এবং মেইলে আপনার নিবন্ধিত ফোন নম্বর অথবা ইমেইল উল্লেখ করুন, যাতে আমরা আপনার অ্যাকাউন্ট শনাক্ত করতে পারি। আমরা যাচাই করার পর অনুরোধটি প্রক্রিয়া করব।
              </>
            ) : (
              <>
                Email our support team at{" "}
                <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Account Deletion Request")}`} className="text-amber-700 underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                with the subject &ldquo;Account Deletion Request,&rdquo; and include the phone number or email your account is registered under so we can identify it. We&apos;ll verify and process your request from there.
              </>
            )}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "কী মুছে ফেলা হয়" : "What Gets Deleted"}
          </h2>
          <p>
            {isBn
              ? "আপনার নাম, ইমেইল, ফোন নম্বর, ডেলিভারি ঠিকানা, প্রোফাইল তথ্য এবং সংরক্ষিত ঠিকানাসমূহ মুছে ফেলা বা অজ্ঞাতকরণ (anonymize) করা হবে।"
              : "Your name, email, phone number, delivery address, profile details, and saved addresses will be deleted or anonymized."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "কী সংরক্ষিত থাকতে পারে" : "What May Be Retained"}
          </h2>
          <p>
            {isBn
              ? "হিসাব-নিকাশ ও আইনি বাধ্যবাধকতার (যেমন কর সংক্রান্ত রেকর্ড) কারণে আমাদের কিছু অর্ডার ও লেনদেনের রেকর্ড নির্দিষ্ট সময়ের জন্য সংরক্ষণ করতে হতে পারে, তবে এই রেকর্ডগুলো আপনার ব্যক্তিগত প্রোফাইল তথ্যের সাথে সরাসরি সংযুক্ত থাকবে না।"
              : "For accounting and legal compliance (e.g. tax record-keeping), we may need to retain certain order and transaction records for a required period — these will no longer be directly linked to your personal profile information."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "প্রক্রিয়াকরণের সময়" : "Processing Time"}
          </h2>
          <p>
            {isBn
              ? "আমরা যাচাইকৃত অনুরোধ ৩০ দিনের মধ্যে প্রক্রিয়া করি।"
              : "We process verified requests within 30 days."}
          </p>
        </section>
      </div>
    </div>
  );
}

import { getLocale } from "next-intl/server";

export default async function TermsOfServicePage() {
  const locale = await getLocale();
  const isBn = locale === "bn";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
        {isBn ? "শর্তাবলী" : "Terms of Service"}
      </h1>

      <div className="space-y-6 text-sm sm:text-base text-gray-600 leading-relaxed">
        <p>
          {isBn
            ? "পূজারিঘর (PujariGhar) ওয়েবসাইট ব্যবহার বা আমাদের কাছ থেকে অর্ডার করার মাধ্যমে আপনি নিচের শর্তাবলীতে সম্মত হচ্ছেন।"
            : "By using the PujariGhar website or placing an order with us, you agree to the following terms and conditions."}
        </p>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "অর্ডার ও মূল্য" : "Orders & Pricing"}
          </h2>
          <p>
            {isBn
              ? "ওয়েবসাইটে প্রদর্শিত সকল মূল্য বাংলাদেশী টাকায়, যেখানে প্রযোজ্য সেখানে কর অন্তর্ভুক্ত। আমরা স্টক প্রাপ্যতা বা মূল্য নির্ধারণে ত্রুটির কারণে যেকোনো অর্ডার প্রত্যাখ্যান বা বাতিল করার অধিকার রাখি।"
              : "All prices listed on the website are in Bangladeshi Taka, inclusive of applicable taxes where relevant. We reserve the right to refuse or cancel any order due to stock unavailability or pricing errors."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "পেমেন্ট" : "Payment"}
          </h2>
          <p>
            {isBn
              ? "আমরা ক্যাশ অন ডেলিভারি এবং অনলাইন পেমেন্ট গ্রহণ করি। অনলাইন পেমেন্ট আমাদের অনুমোদিত পেমেন্ট গেটওয়ে পার্টনারের মাধ্যমে সুরক্ষিতভাবে প্রক্রিয়া করা হয়।"
              : "We accept Cash on Delivery and online payments. Online payments are processed securely through our authorized payment gateway partners."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "ডেলিভারি" : "Delivery"}
          </h2>
          <p>
            {isBn
              ? "ডেলিভারির সময়সীমা এলাকা ও পণ্যের প্রাপ্যতার উপর নির্ভর করে পরিবর্তিত হতে পারে। ডেলিভারি চার্জ চেকআউটের সময় প্রদর্শিত হবে।"
              : "Delivery timelines may vary depending on your location and product availability. Delivery charges, if any, will be shown at checkout."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "পণ্যের তথ্য" : "Product Information"}
          </h2>
          <p>
            {isBn
              ? "আমরা সঠিক পণ্যের বর্ণনা ও ছবি প্রদানের চেষ্টা করি, তবে রঙ বা মাপে সামান্য পার্থক্য হতে পারে। পণ্য সম্পর্কিত নির্দিষ্ট তথ্য জানতে গ্রাহক সেবার সাথে যোগাযোগ করুন।"
              : "We strive to provide accurate product descriptions and images, though slight variations in color or size may occur. Contact customer support for specific product queries."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "দায়বদ্ধতার সীমাবদ্ধতা" : "Limitation of Liability"}
          </h2>
          <p>
            {isBn
              ? "পূজারিঘর পণ্যের ব্যবহার থেকে উদ্ভূত কোনো পরোক্ষ বা আনুষঙ্গিক ক্ষতির জন্য দায়ী থাকবে না।"
              : "PujariGhar shall not be liable for any indirect or incidental damages arising from the use of our products."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {isBn ? "শর্তাবলীর পরিবর্তন" : "Changes to These Terms"}
          </h2>
          <p>
            {isBn
              ? "আমরা যেকোনো সময় এই শর্তাবলী আপডেট করার অধিকার রাখি। ওয়েবসাইটে প্রকাশের পর থেকেই পরিবর্তিত শর্তাবলী কার্যকর হবে।"
              : "We reserve the right to update these terms at any time. Changes take effect immediately upon posting to the website."}
          </p>
        </section>
      </div>
    </div>
  );
}

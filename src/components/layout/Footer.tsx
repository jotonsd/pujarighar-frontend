import { getLocale } from "next-intl/server";
import Link from "next/link";

export default async function Footer() {
  const locale = await getLocale();
  const bn = locale === "bn";
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-0">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🪔</span>
              <span className="text-xl font-bold text-white">PujariGhar</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              {bn
                ? "পূজার সকল প্রয়োজনীয় সামগ্রী এক জায়গায়। বিশুদ্ধ, প্রামাণিক এবং মানসম্পন্ন পণ্য।"
                : "All your puja essentials in one place. Pure, authentic and quality products."}
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              {[
                { label: "Facebook", icon: "f", href: "#" },
                { label: "Instagram", icon: "in", href: "#" },
                { label: "YouTube", icon: "▶", href: "#" },
              ].map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-amber-600 flex items-center justify-center text-xs font-bold text-gray-300 hover:text-white transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {bn ? "দ্রুত লিংক" : "Quick Links"}
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: `/${locale}`, label_bn: "হোম", label_en: "Home" },
                {
                  href: `/${locale}/products`,
                  label_bn: "পণ্য",
                  label_en: "Products",
                },
                {
                  href: `/${locale}/packages`,
                  label_bn: "প্যাকেজ",
                  label_en: "Packages",
                },
                {
                  href: `/${locale}/cart`,
                  label_bn: "কার্ট",
                  label_en: "Cart",
                },
                {
                  href: `/${locale}/track`,
                  label_bn: "অর্ডার ট্র্যাক",
                  label_en: "Track Order",
                },
                {
                  href: `/${locale}/orders`,
                  label_bn: "আমার অর্ডার",
                  label_en: "My Orders",
                },
              ].map(l => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    {bn ? l.label_bn : l.label_en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {bn ? "পূজার সামগ্রী" : "Puja Items"}
            </h3>
            <ul className="space-y-2.5">
              {[
                { label_bn: "প্রতিমা ও মূর্তি", label_en: "Idols & Statues" },
                { label_bn: "ধূপ ও প্রদীপ", label_en: "Incense & Lamps" },
                { label_bn: "ফুল ও মালা", label_en: "Flowers & Garlands" },
                { label_bn: "পূজার পাত্র", label_en: "Puja Utensils" },
                { label_bn: "প্রসাদ সামগ্রী", label_en: "Prasad Items" },
              ].map((item, i) => (
                <li key={i}>
                  <Link
                    href={`/${locale}/products`}
                    className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    {bn ? item.label_bn : item.label_en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {bn ? "যোগাযোগ" : "Contact Us"}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-gray-400">
                <span className="mt-0.5 shrink-0">📍</span>
                <span>{bn ? "ঢাকা, বাংলাদেশ" : "Dhaka, Bangladesh"}</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <span className="shrink-0">📞</span>
                <a
                  href="tel:+8801700000000"
                  className="hover:text-amber-400 transition-colors"
                >
                  +880 1700-000000
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <span className="shrink-0">✉️</span>
                <a
                  href="mailto:info@pujarighar.com"
                  className="hover:text-amber-400 transition-colors"
                >
                  info@pujarighar.com
                </a>
              </li>
            </ul>

            {/* Newsletter */}
            <div className="mt-5">
              <p className="text-xs text-gray-500 mb-2">
                {bn ? "নিউজলেটার সাবস্ক্রাইব করুন" : "Subscribe to newsletter"}
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={bn ? "ইমেইল লিখুন" : "Your email"}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500"
                />
                <button className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-2 rounded-lg transition-colors shrink-0">
                  {bn ? "যোগ দিন" : "Join"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {year} PujariGhar.{" "}
            {bn ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link
              href={`/${locale}`}
              className="hover:text-amber-400 transition-colors"
            >
              {bn ? "গোপনীয়তা নীতি" : "Privacy Policy"}
            </Link>
            <Link
              href={`/${locale}`}
              className="hover:text-amber-400 transition-colors"
            >
              {bn ? "শর্তাবলী" : "Terms of Service"}
            </Link>
            <Link
              href={`/${locale}`}
              className="hover:text-amber-400 transition-colors"
            >
              {bn ? "রিটার্ন নীতি" : "Return Policy"}
            </Link>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span>{bn ? "পেমেন্ট পদ্ধতি:" : "Payment:"}</span>
            {["bKash", "Nagad", "COD"].map(p => (
              <span
                key={p}
                className="bg-gray-800 px-2 py-0.5 rounded text-gray-400"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

import { getLocale } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import FooterOrderLink from "./FooterOrderLink";

async function fetchSettings() {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const res = await fetch(`${base}/api/settings/`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function Footer() {
  const locale = await getLocale();
  const bn = locale === "bn";
  const year = new Date().getFullYear();
  const settings = await fetchSettings();

  const companyName = bn
    ? (settings?.company_name_bn || "পূজারিঘর")
    : (settings?.company_name_en || "PujariGhar");
  const phone   = settings?.contact_phone || "+880 1700-000000";
  const email   = settings?.contact_email || "info@pujarighar.com";
  const address = bn
    ? (settings?.address_bn || "ঢাকা, বাংলাদেশ")
    : (settings?.address_en || "Dhaka, Bangladesh");
  const logoSrc = settings?.logo || "/assets/logo/pujarighar.png";

  return (
    <footer className="bg-gray-900 text-gray-300 mt-0">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt={companyName} className="h-12 w-auto object-contain brightness-0 invert" />
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
                { href: `/${locale}`,          label_bn: "হোম",          label_en: "Home" },
                { href: `/${locale}/products`, label_bn: "পণ্য",          label_en: "Products" },
                { href: `/${locale}/packages`, label_bn: "প্যাকেজ",       label_en: "Packages" },
                { href: `/${locale}/cart`,     label_bn: "কার্ট",          label_en: "Cart" },
                { href: `/${locale}/track`,    label_bn: "অর্ডার ট্র্যাক", label_en: "Track Order" },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-400 hover:text-amber-400 transition-colors">
                    {bn ? l.label_bn : l.label_en}
                  </Link>
                </li>
              ))}
              <FooterOrderLink />
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
                { label_bn: "ধূপ ও প্রদীপ",     label_en: "Incense & Lamps" },
                { label_bn: "ফুল ও মালা",         label_en: "Flowers & Garlands" },
                { label_bn: "পূজার পাত্র",        label_en: "Puja Utensils" },
                { label_bn: "প্রসাদ সামগ্রী",     label_en: "Prasad Items" },
              ].map((item, i) => (
                <li key={i}>
                  <Link href={`/${locale}/products`} className="text-sm text-gray-400 hover:text-amber-400 transition-colors">
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
              {address && (
                <li className="flex items-start gap-2.5 text-sm text-gray-400">
                  <span className="mt-0.5 shrink-0">📍</span>
                  <span>{address}</span>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2.5 text-sm text-gray-400">
                  <span className="shrink-0">📞</span>
                  <a href={`tel:${phone}`} className="hover:text-amber-400 transition-colors">{phone}</a>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2.5 text-sm text-gray-400">
                  <span className="shrink-0">✉️</span>
                  <a href={`mailto:${email}`} className="hover:text-amber-400 transition-colors">{email}</a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {year} {companyName}.{" "}
            {bn ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <Link href={`/${locale}/privacy-policy`} className="hover:text-amber-400 transition-colors">
              {bn ? "গোপনীয়তা নীতি" : "Privacy Policy"}
            </Link>
            <Link href={`/${locale}/terms-of-service`} className="hover:text-amber-400 transition-colors">
              {bn ? "শর্তাবলী" : "Terms of Service"}
            </Link>
            <Link href={`/${locale}/return-policy`} className="hover:text-amber-400 transition-colors">
              {bn ? "রিটার্ন নীতি" : "Return Policy"}
            </Link>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-600">{bn ? "পেমেন্ট:" : "Payment:"}</span>
            {[
              { src: "/assets/payments/bkash.png",     alt: "bKash"      },
              { src: "/assets/payments/nagad.webp",     alt: "Nagad"      },
              { src: "/assets/payments/visa.png",       alt: "Visa"       },
              { src: "/assets/payments/mastercard.png", alt: "Mastercard" },
              { src: "/assets/payments/amex.webp",      alt: "Amex"       },
            ].map(pm => (
              <div key={pm.alt} className="flex items-center justify-center">
                <Image src={pm.src} alt={pm.alt} width={0} height={0} sizes="100vw" className="h-5 w-auto object-contain" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

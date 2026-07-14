import { getLocale } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
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
  const email   = settings?.contact_email || "pujarigharbd@gmail.com";
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
              <Image src={logoSrc} alt={companyName} width={113} height={48} className="h-12 w-auto object-contain brightness-0 invert" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              {bn
                ? "পূজার সকল প্রয়োজনীয় সামগ্রী এক জায়গায়। বিশুদ্ধ, প্রামাণিক এবং মানসম্পন্ন পণ্য।"
                : "All your puja essentials in one place. Pure, authentic and quality products."}
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              {[
                {
                  label: "Facebook",
                  href: "https://www.facebook.com/pujarighar/",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.45 2.91h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94z" />
                    </svg>
                  ),
                },
                {
                  label: "Instagram",
                  href: "#",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2c2.72 0 3.06.01 4.12.06 1.07.05 1.79.22 2.43.46.66.25 1.21.6 1.76 1.15.5.49.86 1.01 1.15 1.76.24.64.41 1.36.46 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.07-.22 1.79-.46 2.43-.25.66-.6 1.21-1.15 1.76-.49.5-1.01.86-1.76 1.15-.64.24-1.36.41-2.43.46-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.07-.05-1.79-.22-2.43-.46-.66-.25-1.21-.6-1.76-1.15-.5-.49-.86-1.01-1.15-1.76-.24-.64-.41-1.36-.46-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.07.22-1.79.46-2.43.25-.66.6-1.21 1.15-1.76.49-.5 1.01-.86 1.76-1.15.64-.24 1.36-.41 2.43-.46C8.94 2.01 9.28 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.4-9a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" />
                    </svg>
                  ),
                },
                {
                  label: "YouTube",
                  href: "#",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.8 8.001s-.2-1.4-.8-2c-.77-.8-1.63-.8-2.03-.86C16.1 5 12 5 12 5h-.01s-4.1 0-6.97.15c-.4.05-1.26.06-2.03.86-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.6c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.77.8 1.78.78 2.23.86C6.9 19 12 19 12 19s4.1 0 6.97-.15c.4-.06 1.26-.06 2.03-.86.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.6c0-1.6-.2-3.2-.2-3.2zM9.96 14.5v-5l5.4 2.5-5.4 2.5z" />
                    </svg>
                  ),
                },
              ].map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href !== "#" ? "_blank" : undefined}
                  rel={s.href !== "#" ? "noopener noreferrer" : undefined}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-amber-600 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
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
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{address}</span>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2.5 text-sm text-gray-400">
                  <Phone className="w-4 h-4 shrink-0" />
                  <a href={`tel:${phone}`} className="hover:text-amber-400 transition-colors">{phone}</a>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2.5 text-sm text-gray-400">
                  <Mail className="w-4 h-4 shrink-0" />
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
          <p className="text-xs text-gray-400">
            © {year} {companyName}.{" "}
            {bn ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
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
            <span className="text-xs text-gray-400">{bn ? "পেমেন্ট:" : "Payment:"}</span>
            {[
              { src: "/assets/payments/bkash.png",     alt: "bKash",      width: 20 },
              { src: "/assets/payments/nagad.webp",     alt: "Nagad",      width: 20 },
              { src: "/assets/payments/visa.png",       alt: "Visa",       width: 36 },
              { src: "/assets/payments/mastercard.png", alt: "Mastercard", width: 33 },
              { src: "/assets/payments/amex.webp",      alt: "Amex",       width: 32 },
            ].map(pm => (
              <div key={pm.alt} className="flex items-center justify-center">
                <Image src={pm.src} alt={pm.alt} width={pm.width} height={20} className="h-5 w-auto object-contain" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

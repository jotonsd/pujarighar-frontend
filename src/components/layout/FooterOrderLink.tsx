"use client";

import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function FooterOrderLink() {
  const user = useAuthStore(s => s.user);
  const locale = useLocale();
  const bn = locale === "bn";

  if (user?.role !== "CUSTOMER") return null;

  return (
    <li>
      <Link href={`/${locale}/orders`} className="text-sm text-gray-400 hover:text-amber-400 transition-colors">
        {bn ? "আমার অর্ডার" : "My Orders"}
      </Link>
    </li>
  );
}

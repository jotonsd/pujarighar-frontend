"use client";

import ErrorState from "@/components/ui/ErrorState";
import { useLocale } from "next-intl";
import { RotateCw } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const isBn = locale === "bn";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      code="500"
      locale={locale}
      title={isBn ? "অভ্যন্তরীণ সার্ভার সমস্যা" : "Internal Server Error"}
      message={
        isBn
          ? "কিছু একটা ভুল হয়েছে আমাদের দিক থেকে। আমরা বিষয়টি দেখছি, কিছুক্ষণ পর আবার চেষ্টা করুন।"
          : "Something went wrong on our end. We're looking into it — please try again shortly."
      }
      action={
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <RotateCw className="w-4 h-4" />
          {isBn ? "আবার চেষ্টা করুন" : "Try Again"}
        </button>
      }
    />
  );
}

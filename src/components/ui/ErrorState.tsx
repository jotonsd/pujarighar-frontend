"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

export default function ErrorState({
  code,
  title,
  message,
  locale,
  action,
}: {
  code: string;
  title: string;
  message: string;
  locale: string;
  action?: React.ReactNode;
}) {
  const router = useRouter();
  const isBn = locale === "bn";

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16 overflow-hidden">
      {/* decorative blurred corners */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-100 opacity-40 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-50 opacity-60 blur-3xl" aria-hidden="true" />

      <div className="relative text-center max-w-lg error-fade-in">
        <p className="text-7xl sm:text-8xl font-extrabold text-gray-900 mb-3 tracking-tight">{code}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
          {isBn ? "ওহো! " : "Oops! "}{title}
        </h1>
        <p className="text-base text-gray-500 mb-10 leading-relaxed">{message}</p>

        <div className="flex items-center justify-center gap-3 mb-10">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors"
          >
            <Home className="w-4 h-4" />
            {isBn ? "হোমে যান" : "Go Home"}
          </Link>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isBn ? "ফিরে যান" : "Go Back"}
          </button>
          {action}
        </div>

        <div className="flex justify-center gap-1.5">
          {[0, 1, 2, 3].map(i => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes error-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .error-fade-in { animation: error-fade-in 0.5s ease-out; }
      `}</style>
    </div>
  );
}

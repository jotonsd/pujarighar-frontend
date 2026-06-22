import { getLocale } from "next-intl/server";
import { Wrench } from "lucide-react";

export default async function MaintenancePage() {
  const locale = await getLocale();
  const isBn = locale === "bn";

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16 overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-100 opacity-40 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-50 opacity-60 blur-3xl" aria-hidden="true" />

      <div className="relative text-center max-w-lg">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
          <Wrench className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
          {isBn ? "সাইট রক্ষণাবেক্ষণে আছে" : "Site Under Maintenance"}
        </h1>
        <p className="text-base text-gray-500 leading-relaxed">
          {isBn
            ? "আমরা বর্তমানে কিছু উন্নয়নের কাজ করছি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।"
            : "We're currently performing some improvements. Please check back shortly."}
        </p>
      </div>
    </div>
  );
}

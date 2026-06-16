import ErrorState from "@/components/ui/ErrorState";
import { getLocale } from "next-intl/server";

export default async function AccessDeniedPage() {
  const locale = await getLocale();
  const isBn = locale === "bn";

  return (
    <ErrorState
      code="403"
      locale={locale}
      title={isBn ? "প্রবেশের অনুমতি নেই" : "Access Denied"}
      message={
        isBn
          ? "এই পেজটি দেখার জন্য আপনার প্রয়োজনীয় অনুমতি নেই। মনে হচ্ছে ভুল অ্যাকাউন্টে লগইন আছেন।"
          : "You don't have permission to view this page. You may be signed in with the wrong account."
      }
    />
  );
}

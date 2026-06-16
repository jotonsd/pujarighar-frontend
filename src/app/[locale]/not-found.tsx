import ErrorState from "@/components/ui/ErrorState";
import { getLocale } from "next-intl/server";

export default async function NotFound() {
  const locale = await getLocale();
  const isBn = locale === "bn";

  return (
    <ErrorState
      code="404"
      locale={locale}
      title={isBn ? "পেজটি খুঁজে পাওয়া যায়নি" : "Page Not Found"}
      message={
        isBn
          ? "আপনি যে পেজটি খুঁজছেন তা সরানো হয়েছে, নাম পরিবর্তন হয়েছে অথবা কখনো ছিল না।"
          : "The page you're looking for was moved, renamed, or never existed."
      }
    />
  );
}

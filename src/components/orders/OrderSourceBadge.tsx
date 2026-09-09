import Badge from "@/components/ui/Badge";
import { OrderSource } from "@/lib/types";

const sourceVariants: Record<OrderSource, "purple" | "blue" | "gray" | "orange"> = {
  AI_CHATBOT: "purple",
  POS: "blue",
  WEBSITE: "gray",
  MOBILE_APP: "orange",
};

const sourceLabels: Record<OrderSource, { bn: string; en: string }> = {
  AI_CHATBOT: { bn: "🤖 ব্রাহ্মণ AI", en: "🤖 Brahman AI" },
  POS: { bn: "🏪 POS", en: "🏪 POS" },
  WEBSITE: { bn: "🌐 ওয়েবসাইট", en: "🌐 Website" },
  MOBILE_APP: { bn: "📱 মোবাইল অ্যাপ", en: "📱 Mobile App" },
};

export default function OrderSourceBadge({
  source,
  locale,
}: {
  source: OrderSource;
  locale: string;
}) {
  return (
    <Badge variant={sourceVariants[source]}>
      {locale === "bn" ? sourceLabels[source].bn : sourceLabels[source].en}
    </Badge>
  );
}

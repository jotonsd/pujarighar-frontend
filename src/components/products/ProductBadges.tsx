import { ProductBadge } from "@/lib/types";

export const BADGE_STYLE: Record<ProductBadge, { bn: string; en: string; className: string }> = {
  new:         { bn: "নতুন",        en: "New",        className: "bg-red-700 text-white" },
  trendy:      { bn: "ট্রেন্ডি",     en: "Trendy",     className: "bg-purple-700 text-white" },
  flash_sale:  { bn: "ফ্ল্যাশ সেল",  en: "Flash Sale", className: "bg-gray-900 text-white" },
};

export default function ProductBadges({ badges, locale }: { badges: ProductBadge[]; locale: string }) {
  if (badges.length === 0) return null;
  return (
    <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1 items-start">
      {badges.map(b => {
        const style = BADGE_STYLE[b];
        if (!style) return null;
        return (
          <span key={b} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${style.className}`}>
            {locale === "bn" ? style.bn : style.en}
          </span>
        );
      })}
    </div>
  );
}

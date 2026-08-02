import { ProductBadge } from "@/lib/types";

const OPTIONS: { value: ProductBadge; bn: string; en: string }[] = [
  { value: "new",        bn: "নতুন",       en: "New" },
  { value: "trendy",     bn: "ট্রেন্ডি",    en: "Trendy" },
  { value: "flash_sale", bn: "ফ্ল্যাশ সেল", en: "Flash Sale" },
];

export default function BadgePicker({
  value,
  onChange,
  locale,
}: {
  value: ProductBadge[];
  onChange: (badges: ProductBadge[]) => void;
  locale: string;
}) {
  const toggle = (badge: ProductBadge) => {
    onChange(value.includes(badge) ? value.filter(b => b !== badge) : [...value, badge]);
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-600 mb-2">
        {locale === "bn" ? "ব্যাজ" : "Badges"}
      </p>
      <div className="flex flex-wrap gap-3">
        {OPTIONS.map(opt => (
          <label
            key={opt.value}
            className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={value.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            {locale === "bn" ? opt.bn : opt.en}
          </label>
        ))}
      </div>
    </div>
  );
}

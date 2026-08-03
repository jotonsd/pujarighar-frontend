import { BaynaServiceType } from "@/lib/types";
import { BadgeCheck, Drum, Sparkles } from "lucide-react";

export const SERVICE_TYPES = [
  { value: "PUJARI", icon: BadgeCheck, bn: "পূজারী", en: "Pujari" },
  { value: "DHAKI",  icon: Drum,       bn: "ঢাকি",    en: "Dhaki" },
  { value: "MURTI",  icon: Sparkles,   bn: "মূর্তি",   en: "Murti" },
] as const;

export default function ServiceTypeSelector({
  value,
  onChange,
  locale,
}: {
  value: BaynaServiceType;
  onChange: (value: BaynaServiceType) => void;
  locale: string;
}) {
  const isBn = locale === "bn";
  return (
    <div className="grid grid-cols-3 gap-2">
      {SERVICE_TYPES.map(s => (
        <button
          key={s.value}
          type="button"
          onClick={() => onChange(s.value)}
          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-colors ${
            value === s.value
              ? "border-amber-600 bg-amber-50 text-amber-700"
              : "border-gray-200 text-gray-500 hover:border-gray-300"
          }`}
        >
          <s.icon className="w-5 h-5" />
          <span className="text-xs font-semibold">{isBn ? s.bn : s.en}</span>
        </button>
      ))}
    </div>
  );
}

"use client";

import { VariantSelection } from "@/hooks/useVariantSelection";

interface Props {
  selection: VariantSelection;
  locale: string;
  // Tighter spacing/sizing for the compact product-card context — same
  // generic per-type rendering, just smaller.
  compact?: boolean;
}

// One pill-row per attribute type a product's variants actually use (e.g.
// Color, Size) — generic by construction so a future type (Weight, etc.)
// renders here with zero new code, driven entirely by
// useVariantSelection's derived `types` list.
export default function VariantPillPicker({ selection, locale, compact = false }: Props) {
  const isBn = locale === "bn";
  if (!selection.hasVariants) return null;

  return (
    <div className={compact ? "space-y-1" : "space-y-3"}>
      {selection.types.map(type => (
        <div key={type.code}>
          {!compact && (
            <p className="text-sm font-semibold text-body mb-1.5">
              {isBn ? type.name_bn : type.name_en}
              {!selection.selected[type.code] && <span className="text-red-500"> *</span>}
            </p>
          )}
          <div className={`flex flex-wrap ${compact ? "gap-1" : "gap-2"}`}>
            {type.values.map(value => {
              const active = selection.selected[type.code] === value.id;
              const label = isBn ? (value.label_bn || value.label_en) : (value.label_en || value.label_bn);
              return (
                <button
                  key={value.id}
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    selection.select(type.code, value.id);
                  }}
                  className={
                    compact
                      ? `px-1.5 py-0.5 rounded border text-[10px] font-semibold transition-colors ${
                          active
                            ? "border-amber-600 bg-amber-50 text-amber-700"
                            : "border-border text-muted"
                        }`
                      : `px-3.5 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                          active
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                            : "border-border text-muted hover:border-amber-300"
                        }`
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

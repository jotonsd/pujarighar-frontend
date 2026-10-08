import { useEffect, useMemo, useState } from "react";
import { Product, ProductVariant } from "@/lib/types";

export interface VariantTypeOption {
  code: string;
  name_bn: string;
  name_en: string;
  values: { id: string; label_bn: string; label_en: string }[];
}

export interface VariantSelection {
  // One pill-row per attribute type the product's variants actually use
  // (e.g. [Color, Size]) — generic by construction, so a future type like
  // Weight needs zero new code here.
  types: VariantTypeOption[];
  selected: Record<string, string>;
  select: (typeCode: string, valueId: string) => void;
  // The one ProductVariant matching every selected value, once every
  // required type has a pick — null while the selection is incomplete or
  // (shouldn't happen) matches nothing.
  resolvedVariant: ProductVariant | null;
  isComplete: boolean;
  hasVariants: boolean;
}

/**
 * Derives the generic attribute-type/value pill-rows for a variant-bearing
 * product and resolves the customer's picks down to one specific
 * ProductVariant — shared by the product detail page, the compact product
 * card, and POS, so "add a new attribute type later" only ever needs a new
 * VariantAttributeType row on the backend, never new UI code here.
 */
export function useVariantSelection(product: Product | undefined): VariantSelection {
  // Deactivated variants (e.g. a permanently-out-of-stock color the admin
  // hid) must never be selectable, auto-picked as the default, or resolved
  // to — otherwise a customer can land on the page with that dead variant
  // pre-selected and see "out of stock" even though other, active variants
  // still have real stock.
  const variants = useMemo(() => (product?.variants ?? []).filter(v => v.is_active), [product]);
  const hasVariants = variants.length > 0;

  const types = useMemo<VariantTypeOption[]>(() => {
    const byCode = new Map<string, VariantTypeOption>();
    for (const variant of variants) {
      for (const av of variant.attribute_values) {
        let type = byCode.get(av.attribute_type_code);
        if (!type) {
          type = {
            code: av.attribute_type_code,
            name_bn: av.attribute_type_name_bn,
            name_en: av.attribute_type_name_en,
            values: [],
          };
          byCode.set(av.attribute_type_code, type);
        }
        if (!type.values.some(v => v.id === av.value_id)) {
          type.values.push({ id: av.value_id, label_bn: av.value_bn, label_en: av.value_en });
        }
      }
    }
    return Array.from(byCode.values());
  }, [variants]);

  const [selected, setSelected] = useState<Record<string, string>>({});

  // Auto-pick the first variant's combination once the product loads (or
  // changes) — the customer still can switch any pill, this just removes
  // the extra required tap for the common "just add the default" case.
  useEffect(() => {
    if (variants.length === 0) {
      setSelected({});
      return;
    }
    const first = variants[0];
    const initial: Record<string, string> = {};
    for (const av of first.attribute_values) {
      initial[av.attribute_type_code] = av.value_id;
    }
    setSelected(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const select = (typeCode: string, valueId: string) => {
    setSelected(prev => ({ ...prev, [typeCode]: valueId }));
  };

  const isComplete = types.every(t => !!selected[t.code]);

  const resolvedVariant = useMemo(() => {
    if (!isComplete || variants.length === 0) return null;
    return (
      variants.find(v =>
        v.attribute_values.every(av => selected[av.attribute_type_code] === av.value_id)
        && v.attribute_values.length === types.length,
      ) ?? null
    );
  }, [variants, selected, isComplete, types.length]);

  return { types, selected, select, resolvedVariant, isComplete, hasVariants };
}

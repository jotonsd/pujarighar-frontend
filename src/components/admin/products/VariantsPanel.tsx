"use client";

import {
  useGetAttributeTypesQuery,
  useGetAttributeValuesQuery,
  useCreateAttributeValueMutation,
  useGenerateProductVariantsMutation,
  useUpdateProductVariantMutation,
  useDeleteProductVariantMutation,
} from "@/api/products/productsApi";
import { Product, VariantAttributeType } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { getErrorMessage } from "@/utils/apiError";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface Props {
  product: Product;
  locale: string;
}

// One attribute type's value-checklist + inline "add new" — used once per
// type inside the picker below. Generic by construction: works identically
// for Color, Size, or any future type with zero changes.
function TypeValuePicker({
  type,
  selected,
  onToggle,
  locale,
}: {
  type: VariantAttributeType;
  selected: Set<string>;
  onToggle: (valueId: string) => void;
  locale: string;
}) {
  const isBn = locale === "bn";
  const { data: values = [] } = useGetAttributeValuesQuery({ attribute_type_id: type.id });
  const [createValue] = useCreateAttributeValueMutation();
  const [adding, setAdding] = useState(false);
  const [newBn, setNewBn] = useState("");
  const [newEn, setNewEn] = useState("");

  const submitNew = async () => {
    const en = newEn.trim();
    const bn = newBn.trim();
    if (!en && !bn) return;
    try {
      const created = await createValue({ attribute_type_id: type.id, value_bn: bn, value_en: en || bn }).unwrap();
      onToggle(created.id);
      setAdding(false);
      setNewBn("");
      setNewEn("");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted">{isBn ? type.name_bn : type.name_en}</p>
      <div className="flex flex-wrap gap-2">
        {values.map(v => {
          const label = isBn ? (v.value_bn || v.value_en) : (v.value_en || v.value_bn);
          const isSelected = selected.has(v.id);
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onToggle(v.id)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                isSelected
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-surface text-muted border-border hover:border-amber-400"
              }`}
            >
              {label}
            </button>
          );
        })}
        {adding ? (
          <div className="flex items-center gap-1">
            {type.has_bilingual_values && (
              <input
                autoFocus
                type="text"
                value={newBn}
                onChange={e => setNewBn(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") submitNew(); if (e.key === "Escape") setAdding(false); }}
                placeholder="বাংলা"
                className="w-20 text-xs px-2 py-1 rounded border border-border bg-background text-body"
              />
            )}
            <input
              autoFocus={!type.has_bilingual_values}
              type="text"
              value={newEn}
              onChange={e => setNewEn(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submitNew(); if (e.key === "Escape") setAdding(false); }}
              placeholder={isBn ? "নতুন মান" : "New value"}
              className="w-20 text-xs px-2 py-1 rounded border border-border bg-background text-body"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="px-2.5 py-1 rounded-full text-xs border border-dashed border-border text-muted hover:border-amber-400 hover:text-amber-600"
          >
            {isBn ? "+ নতুন" : "+ New"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function VariantsPanel({ product, locale }: Props) {
  const isBn = locale === "bn";
  const { data: attributeTypes = [] } = useGetAttributeTypesQuery();
  const [selectedValueIds, setSelectedValueIds] = useState<Set<string>>(new Set());
  const [generateVariants, { isLoading: generating }] = useGenerateProductVariantsMutation();
  const [updateVariant] = useUpdateProductVariantMutation();
  const [deleteVariant] = useDeleteProductVariantMutation();

  const toggleValue = (valueId: string) => {
    setSelectedValueIds(prev => {
      const next = new Set(prev);
      if (next.has(valueId)) next.delete(valueId);
      else next.add(valueId);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selectedValueIds.size === 0) return;
    try {
      const created = await generateVariants({ productId: product.id, value_ids: Array.from(selectedValueIds) }).unwrap();
      toast.success(
        isBn ? `${created.length}টি ভ্যারিয়েন্ট তৈরি হয়েছে` : `${created.length} variant(s) created`,
      );
      setSelectedValueIds(new Set());
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  const handleToggleActive = async (variantId: string, isActive: boolean) => {
    try {
      await updateVariant({ productId: product.id, variantId, is_active: !isActive }).unwrap();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  const handleDelete = async (variantId: string) => {
    try {
      await deleteVariant({ productId: product.id, variantId }).unwrap();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  return (
    <div className="pt-2 border-t border-border space-y-3">
      <h3 className="text-sm font-semibold text-muted">
        {isBn ? "ভ্যারিয়েন্ট (রং, সাইজ ইত্যাদি)" : "Variants (color, size, etc.)"}
      </h3>
      <p className="text-xs text-muted -mt-2">
        {isBn
          ? "প্রতিটি ধরন থেকে মান নির্বাচন করুন — সম্ভাব্য সকল কম্বিনেশনের ভ্যারিয়েন্ট তৈরি হবে।"
          : "Pick values from each type — a variant is generated for every combination."}
      </p>

      <div className="space-y-3">
        {attributeTypes.map(type => (
          <TypeValuePicker key={type.id} type={type} selected={selectedValueIds} onToggle={toggleValue} locale={locale} />
        ))}
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={selectedValueIds.size === 0 || generating}
        className="btn-secondary text-sm"
      >
        {generating ? (isBn ? "তৈরি হচ্ছে..." : "Generating...") : (isBn ? "ভ্যারিয়েন্ট তৈরি করুন" : "Generate variants")}
      </button>

      {product.variants.length > 0 && (
        <div className="space-y-2 pt-2">
          {product.variants.map(variant => (
            <div key={variant.id} className="flex items-center gap-3 border border-border rounded-lg px-3 py-2">
              <span className="text-sm font-medium flex-1">{isBn ? variant.label_bn : variant.label_en}</span>
              <span className="text-xs text-muted">{isBn ? "স্টক" : "Stock"}: {variant.stock_on_hand}</span>
              <label className="flex items-center gap-1 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={variant.is_active}
                  onChange={() => handleToggleActive(variant.id, variant.is_active)}
                />
                {isBn ? "সক্রিয়" : "Active"}
              </label>
              <button
                type="button"
                onClick={() => handleDelete(variant.id)}
                className="text-muted hover:text-red-600"
                title={isBn ? "মুছুন" : "Delete"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

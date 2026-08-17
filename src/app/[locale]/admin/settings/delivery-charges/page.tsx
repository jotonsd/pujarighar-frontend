"use client";

import { DeliveryWeightTier, useGetDeliveryChargesQuery, useUpdateDeliveryChargesMutation } from "@/api/deliveryCharges/deliveryChargesApi";
import { FloatingInput } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/store/toastStore";
import { Plus, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

function WeightTierEditor({
  title,
  tiers,
  onChange,
  isBn,
}: {
  title: string;
  tiers: DeliveryWeightTier[];
  onChange: (tiers: DeliveryWeightTier[]) => void;
  isBn: boolean;
}) {
  const updateRow = (i: number, key: keyof DeliveryWeightTier, val: string) =>
    onChange(tiers.map((t, idx) => (idx === i ? { ...t, [key]: val } : t)));

  const addRow = () => onChange([...tiers, { max_weight_kg: "", charge_amount: "" }]);
  const removeRow = (i: number) => onChange(tiers.filter((_, idx) => idx !== i));

  return (
    <div className="pt-2 border-t border-gray-100">
      <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
      <p className="text-xs text-gray-400 mb-2">
        {isBn
          ? "ঐচ্ছিক — খালি রাখলে উপরের ফ্ল্যাট রেট প্রযোজ্য হবে। ওজন যত কেজি পর্যন্ত, সেই ব্র্যাকেটের চার্জ প্রযোজ্য হবে। সবচেয়ে ভারী ব্র্যাকেট এর চেয়ে বেশি ওজনের জন্যও প্রযোজ্য।"
          : "Optional — leave empty to keep using the flat rate above. Each row is \"up to this weight → this charge\"; the heaviest row also covers anything above it."}
      </p>
      <div className="space-y-2">
        {tiers.map((t, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
            <FloatingInput
              label={isBn ? "সর্বোচ্চ ওজন (কেজি)" : "Up to weight (kg)"}
              type="number" min="0" step="0.01"
              value={t.max_weight_kg}
              onChange={e => updateRow(i, "max_weight_kg", e.target.value)}
            />
            <FloatingInput
              label={isBn ? "চার্জ (৳)" : "Charge (৳)"}
              type="number" min="0" step="1"
              value={t.charge_amount}
              onChange={e => updateRow(i, "charge_amount", e.target.value)}
            />
            <button
              onClick={() => removeRow(i)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-400 hover:bg-red-100 transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addRow}
        className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-700 font-medium"
      >
        <Plus className="w-3.5 h-3.5" /> {isBn ? "ব্র্যাকেট যোগ করুন" : "Add bracket"}
      </button>
    </div>
  );
}

export default function DeliveryChargesPage() {
  const locale = useLocale();
  const isBn   = locale === "bn";

  const { data, isLoading } = useGetDeliveryChargesQuery();
  const [update, { isLoading: saving }] = useUpdateDeliveryChargesMutation();

  const [insideDhaka,  setInsideDhaka]  = useState("");
  const [outsideDhaka, setOutsideDhaka] = useState("");
  const [insideTiers,  setInsideTiers]  = useState<DeliveryWeightTier[]>([]);
  const [outsideTiers, setOutsideTiers] = useState<DeliveryWeightTier[]>([]);

  useEffect(() => {
    if (data) {
      setInsideDhaka(data.inside_dhaka);
      setOutsideDhaka(data.outside_dhaka);
      setInsideTiers(data.inside_dhaka_weight_tiers ?? []);
      setOutsideTiers(data.outside_dhaka_weight_tiers ?? []);
    }
  }, [data]);

  const handleSave = async () => {
    const validTiers = (tiers: DeliveryWeightTier[]) =>
      tiers.filter(t => t.max_weight_kg !== "" && t.charge_amount !== "");
    try {
      await update({
        inside_dhaka: insideDhaka,
        outside_dhaka: outsideDhaka,
        inside_dhaka_weight_tiers: validTiers(insideTiers),
        outside_dhaka_weight_tiers: validTiers(outsideTiers),
      }).unwrap();
      toast.success(isBn ? "ডেলিভারি চার্জ আপডেট হয়েছে" : "Delivery charges updated");
    } catch {
      toast.error(isBn ? "আপডেট ব্যর্থ হয়েছে" : "Update failed");
    }
  };

  return (
    <div className="max-w-xl">
      <PageHeader
        title={isBn ? "ডেলিভারি চার্জ" : "Delivery Charges"}
        description={isBn ? "ঢাকার ভিতরে ও বাইরের ডেলিভারি চার্জ নির্ধারণ করুন" : "Set delivery charges for inside and outside Dhaka"}
        showBack
      />

      <div className="card space-y-6">
        {isLoading ? (
          <>
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
          </>
        ) : (
          <>
            <div>
              <p className="text-xs text-gray-400 mb-1">
                {isBn ? "ঢাকার জেলাসমূহ (Inside Dhaka)" : "Dhaka district"}
              </p>
              <FloatingInput
                label={isBn ? "ঢাকার ভিতরে (৳)" : "Inside Dhaka (৳)"}
                type="number"
                min="0"
                step="1"
                value={insideDhaka}
                onChange={e => setInsideDhaka(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">
                {isBn ? "ঢাকার বাইরের জেলাসমূহ" : "All other districts"}
              </p>
              <FloatingInput
                label={isBn ? "ঢাকার বাইরে (৳)" : "Outside Dhaka (৳)"}
                type="number"
                min="0"
                step="1"
                value={outsideDhaka}
                onChange={e => setOutsideDhaka(e.target.value)}
              />
            </div>

            <WeightTierEditor
              title={isBn ? "ওজনভিত্তিক চার্জ — ঢাকার ভিতরে" : "Weight-based charge — Inside Dhaka"}
              tiers={insideTiers}
              onChange={setInsideTiers}
              isBn={isBn}
            />
            <WeightTierEditor
              title={isBn ? "ওজনভিত্তিক চার্জ — ঢাকার বাইরে" : "Weight-based charge — Outside Dhaka"}
              tiers={outsideTiers}
              onChange={setOutsideTiers}
              isBn={isBn}
            />

            <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
              {saving ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

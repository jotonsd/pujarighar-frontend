"use client";

import { useGetDeliveryChargesQuery, useUpdateDeliveryChargesMutation } from "@/api/deliveryCharges/deliveryChargesApi";
import { FloatingInput } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/store/toastStore";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

export default function DeliveryChargesPage() {
  const locale = useLocale();
  const isBn   = locale === "bn";

  const { data, isLoading } = useGetDeliveryChargesQuery();
  const [update, { isLoading: saving }] = useUpdateDeliveryChargesMutation();

  const [insideDhaka,  setInsideDhaka]  = useState("");
  const [outsideDhaka, setOutsideDhaka] = useState("");

  useEffect(() => {
    if (data) {
      setInsideDhaka(data.inside_dhaka);
      setOutsideDhaka(data.outside_dhaka);
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await update({ inside_dhaka: insideDhaka, outside_dhaka: outsideDhaka }).unwrap();
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
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
              {saving ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

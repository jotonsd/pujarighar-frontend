"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Plus, Ticket } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { FloatingInput, FloatingSelect, FloatingDatePicker } from "@/components/ui/forms";
import { toast } from "@/store/toastStore";
import {
  useGetPromoCodesQuery,
  useCreatePromoCodeMutation,
  useUpdatePromoCodeMutation,
  PromoCode,
  PromoDiscountType,
  PromoScope,
} from "@/api/promoCodes/promoCodesApi";

function PromoCodeRow({ promo, isBn }: { promo: PromoCode; isBn: boolean }) {
  const [update, { isLoading }] = useUpdatePromoCodeMutation();
  const toggleActive = () => update({ id: promo.id, is_active: !promo.is_active }).unwrap().catch(() =>
    toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed to update"));
  const cycleScope = (): PromoScope =>
    promo.scope === "MOBILE_APP" ? "WEBSITE" : promo.scope === "WEBSITE" ? "BOTH" : "MOBILE_APP";
  const toggleScope = () => update({ id: promo.id, scope: cycleScope() }).unwrap().catch(() =>
    toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed to update"));

  const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(isBn ? "bn-BD" : "en-US") : null;
  const statusLabel = !promo.is_active
    ? (isBn ? "নিষ্ক্রিয়" : "Inactive")
    : promo.is_valid_now
      ? (isBn ? "সক্রিয়" : "Active")
      : (isBn ? "মেয়াদোত্তীর্ণ / শুরু হয়নি" : "Expired / not started yet");
  const scopeLabel = promo.scope === "MOBILE_APP" ? (isBn ? "শুধু অ্যাপ" : "App only")
    : promo.scope === "WEBSITE" ? (isBn ? "শুধু ওয়েবসাইট" : "Website only")
    : (isBn ? "অ্যাপ ও ওয়েবসাইট" : "App & website");

  return (
    <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-gray-800">{promo.code}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            !promo.is_active ? "bg-gray-100 text-gray-500"
              : promo.is_valid_now ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
          }`}>
            {statusLabel}
          </span>
          <button
            onClick={toggleScope}
            disabled={isLoading}
            className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            title={isBn ? "স্কোপ পরিবর্তন করতে ক্লিক করুন" : "Click to switch scope"}
          >
            {scopeLabel}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {promo.discount_type === "PERCENT" ? `${promo.discount_value}%` : `৳${promo.discount_value}`}
          {" "}{isBn ? "ছাড়" : "off"}
          {(promo.valid_from || promo.valid_until) && (
            <span className="text-gray-400">
              {" · "}
              {promo.valid_from ? fmt(promo.valid_from) : (isBn ? "এখন থেকে" : "from now")}
              {" – "}
              {promo.valid_until ? fmt(promo.valid_until) : (isBn ? "কোনো শেষ তারিখ নেই" : "no end date")}
            </span>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {isBn ? `${promo.times_used} বার ব্যবহৃত হয়েছে` : `Used ${promo.times_used} time${promo.times_used === 1 ? "" : "s"}`}
        </p>
      </div>
      <button onClick={toggleActive} disabled={isLoading} className={promo.is_active ? "btn-secondary text-sm" : "btn-primary text-sm"}>
        {promo.is_active ? (isBn ? "নিষ্ক্রিয় করুন" : "Deactivate") : (isBn ? "সক্রিয় করুন" : "Activate")}
      </button>
    </div>
  );
}

function AddPromoCodeForm({ isBn, onDone }: { isBn: boolean; onDone: () => void }) {
  const [code, setCode] = useState("");
  const [scope, setScope] = useState<PromoScope>("MOBILE_APP");
  const [validUntil, setValidUntil] = useState("");
  const [discountType, setDiscountType] = useState<PromoDiscountType>("PERCENT");
  const [discountValue, setDiscountValue] = useState("10");
  const [isActive, setIsActive] = useState(true);
  const [create, { isLoading }] = useCreatePromoCodeMutation();

  const handleCreate = async () => {
    if (!code.trim() || !discountValue) return;
    try {
      await create({
        code: code.trim(),
        scope,
        discount_type: discountType,
        discount_value: discountValue,
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        is_active: isActive,
      }).unwrap();
      toast.success(isBn ? "প্রোমো কোড তৈরি হয়েছে" : "Promo code created");
      onDone();
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে — কোডটি হয়তো আগে থেকেই আছে" : "Failed — the code may already exist");
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <FloatingInput label={isBn ? "কোড (যেমন: PUJA10)" : "Code (e.g. PUJA10)"} value={code}
          onChange={e => setCode(e.target.value.toUpperCase())} />
        <FloatingSelect
          label={isBn ? "কোথায় ব্যবহারযোগ্য" : "Usable on"}
          value={scope}
          onChange={value => setScope(value as PromoScope)}
        >
          <option value="MOBILE_APP">{isBn ? "শুধু মোবাইল অ্যাপ" : "Mobile app only"}</option>
          <option value="WEBSITE">{isBn ? "শুধু ওয়েবসাইট" : "Website only"}</option>
          <option value="BOTH">{isBn ? "অ্যাপ ও ওয়েবসাইট উভয়ই" : "Both app & website"}</option>
        </FloatingSelect>
        <FloatingDatePicker
          label={isBn ? "মেয়াদ শেষের তারিখ (ঐচ্ছিক)" : "Valid until (optional)"}
          value={validUntil} onChange={setValidUntil}
          minDate={new Date()}
          clearable
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FloatingSelect
          label={isBn ? "ছাড়ের ধরন" : "Discount type"}
          value={discountType}
          onChange={value => setDiscountType(value as PromoDiscountType)}
        >
          <option value="PERCENT">{isBn ? "শতাংশ (%)" : "Percentage (%)"}</option>
          <option value="FLAT">{isBn ? "নির্দিষ্ট পরিমাণ (৳)" : "Flat amount (৳)"}</option>
        </FloatingSelect>
        <FloatingInput
          label={discountType === "PERCENT" ? (isBn ? "ছাড়ের হার (%)" : "Discount (%)") : (isBn ? "ছাড়ের পরিমাণ (৳)" : "Discount amount (৳)")}
          type="number" min="0" step="0.01" value={discountValue} onChange={e => setDiscountValue(e.target.value)}
        />
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setIsActive(v => !v)}
            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${isActive ? "bg-amber-600" : "bg-gray-200"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : ""}`} />
          </div>
          <span className="text-sm text-gray-700">
            {isActive ? (isBn ? "সক্রিয়" : "Active") : (isBn ? "নিষ্ক্রিয়" : "Inactive")}
          </span>
        </label>
      </div>
      <p className="text-xs text-gray-400">
        {isBn
          ? "শুধুমাত্র লগইন করা গ্রাহকের সংশ্লিষ্ট চ্যানেলে (অ্যাপ/ওয়েবসাইট) প্রথম অর্ডারেই ব্যবহারযোগ্য। মেয়াদ শেষের তারিখ ফাঁকা রাখলে কোনো ডেডলাইন থাকবে না।"
          : "Usable only on a logged-in customer's first order on the matching channel (app/website). Leave the end date blank for no deadline."}
      </p>
      <div className="flex gap-2">
        <button onClick={handleCreate} disabled={isLoading || !code.trim()} className="btn-primary text-sm">
          {isLoading ? (isBn ? "তৈরি হচ্ছে..." : "Creating...") : (isBn ? "তৈরি করুন" : "Create")}
        </button>
        <button onClick={onDone} className="btn-secondary text-sm">{isBn ? "বাতিল" : "Cancel"}</button>
      </div>
    </div>
  );
}

export default function PromoCodesAdminPage() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const { data: codes = [], isLoading } = useGetPromoCodesQuery();
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div>
      <PageHeader
        title={isBn ? "প্রোমো কোড" : "Promo Codes"}
        description={
          isBn
            ? "অ্যাপ বা ওয়েবসাইটে ডাউনলোড/অর্ডার উৎসাহ দিতে প্রোমো কোড তৈরি করুন — শুধুমাত্র লগইন করা গ্রাহকের নির্দিষ্ট চ্যানেলে প্রথম অর্ডারেই কাজ করবে, গেস্ট অর্ডারে নয়।"
            : "Create promo codes to encourage app downloads or website orders — each only works on a logged-in customer's first order on that channel, never on a guest order."
        }
      />

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          <Ticket className="w-4 h-4" />
          {isBn ? "প্রোমো কোড তালিকা" : "Promo Code List"}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map(p => <PromoCodeRow key={p.id} promo={p} isBn={isBn} />)}
            {codes.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                {isBn ? "এখনো কোনো প্রোমো কোড তৈরি হয়নি" : "No promo codes yet"}
              </p>
            )}
          </div>
        )}

        {showAddForm ? (
          <AddPromoCodeForm isBn={isBn} onDone={() => setShowAddForm(false)} />
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-amber-400 hover:text-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isBn ? "নতুন প্রোমো কোড যোগ করুন" : "Add New Promo Code"}
          </button>
        )}
      </div>
    </div>
  );
}

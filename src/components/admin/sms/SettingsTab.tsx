"use client";

import { useGetSmsSettingsQuery, useUpdateSmsSettingsMutation } from "@/api/sms/smsApi";
import { FloatingInput } from "@/components/ui/forms";
import { toast } from "@/store/toastStore";
import { useEffect, useState } from "react";

export default function SettingsTab({ isBn }: { isBn: boolean }) {
  const { data: settings, isLoading: loadingSettings } = useGetSmsSettingsQuery();
  const [update, { isLoading }] = useUpdateSmsSettingsMutation();

  const [form, setForm] = useState({ sms_api_key: "", sms_sender_id: "" });

  useEffect(() => {
    if (settings) setForm({ sms_api_key: "", sms_sender_id: settings.sms_sender_id ?? "" });
  }, [settings]);

  const f = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    try {
      await update({
        ...(form.sms_api_key ? { sms_api_key: form.sms_api_key } : {}),
        sms_sender_id: form.sms_sender_id,
      }).unwrap();
      toast.success(isBn ? "সংরক্ষিত হয়েছে" : "Saved");
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed to save");
    }
  };

  if (loadingSettings || !settings) {
    return (
      <div className="space-y-3 max-w-lg">
        {[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-gray-600 space-y-1.5 leading-relaxed">
        <p className="font-semibold text-amber-700">
          {isBn ? "BulkSMSBD থেকে সংগ্রহ করুন" : "Get these from BulkSMSBD"}
        </p>
        <p>
          {isBn
            ? "আপনার bulksmsbd.net প্যানেলে লগইন করুন — সেখানে API Key এবং অনুমোদিত Sender ID পাবেন।"
            : "Log in to your bulksmsbd.net panel — your API Key and approved Sender ID are shown there."}
        </p>
      </div>
      <FloatingInput
        label={isBn ? "এপিআই কী" : "API Key"}
        type="password"
        value={form.sms_api_key}
        onChange={f("sms_api_key")}
        placeholder={settings.has_sms_api_key ? (isBn ? "সংরক্ষিত আছে — পরিবর্তন করতে নতুনটি লিখুন" : "Already saved — enter a new one to change") : "L51H5bEw9CevhsE6TiTu"}
      />
      <FloatingInput
        label={isBn ? "সেন্ডার আইডি" : "Sender ID"}
        value={form.sms_sender_id}
        onChange={f("sms_sender_id")}
        placeholder="8809XXXXXXXX"
      />
      <p className="text-xs text-gray-400">
        {isBn
          ? "কনফিগার করা থাকলে, স্টাফ অর্ডার নিশ্চিত করলে গ্রাহককে স্বয়ংক্রিয়ভাবে একটি এসএমএস পাঠানো হবে।"
          : "Once configured, customers automatically receive an SMS when staff confirm their order."}
      </p>
      <button onClick={handleSave} disabled={isLoading || !form.sms_sender_id} className="btn-primary">
        {isLoading ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save Changes")}
      </button>
    </div>
  );
}

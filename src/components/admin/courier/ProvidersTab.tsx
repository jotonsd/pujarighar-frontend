"use client";

import {
  useCreateCourierProviderMutation,
  useGetCourierProviderBalanceQuery,
  useGetCourierProvidersQuery,
  useUpdateCourierProviderMutation,
} from "@/api/courier/courierApi";
import { FloatingInput } from "@/components/ui/forms";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import { CourierProvider } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { formatAmount } from "@/utils/format";
import { useState } from "react";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const WEBHOOK_URL = `${API_ORIGIN}/api/courier/webhooks/steadfast/`;

function ProviderCard({ provider, isBn, locale }: { provider: CourierProvider; isBn: boolean; locale: string }) {
  const [editing, setEditing] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [update, { isLoading }] = useUpdateCourierProviderMutation();
  const { data: balance, refetch: refetchBalance, isFetching: balanceLoading } = useGetCourierProviderBalanceQuery(provider.id, { skip: !provider.is_active });

  const handleToggleActive = async () => {
    try {
      await update({ id: provider.id, is_active: !provider.is_active }).unwrap();
      toast.success(isBn ? "আপডেট হয়েছে" : "Updated");
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed to update");
    }
  };

  const handleSaveKeys = async () => {
    try {
      await update({
        id: provider.id,
        ...(apiKey ? { api_key: apiKey } : {}),
        ...(secretKey ? { secret_key: secretKey } : {}),
      }).unwrap();
      toast.success(isBn ? "সংরক্ষণ হয়েছে" : "Saved");
      setApiKey("");
      setSecretKey("");
      setEditing(false);
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed to save");
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-800">{provider.name}</h3>
          <p className="text-xs text-gray-500 font-mono">{provider.code} · {provider.base_url}</p>
        </div>
        <ToggleSwitch
          checked={provider.is_active}
          onChange={handleToggleActive}
          activeLabel={isBn ? "সক্রিয়" : "Active"}
          inactiveLabel={isBn ? "নিষ্ক্রিয়" : "Inactive"}
        />
      </div>

      {provider.is_active && (
        <div className="flex items-center gap-2 text-sm bg-amber-50 rounded-lg px-3 py-2">
          <span className="text-gray-600">{isBn ? "বর্তমান ব্যালেন্স:" : "Current balance:"}</span>
          <span className="font-bold text-amber-700">
            {balanceLoading ? "..." : formatAmount(balance?.current_balance ?? 0, locale, 2)}
          </span>
          <button onClick={() => refetchBalance()} className="ml-auto text-xs text-amber-700 hover:underline">
            {isBn ? "রিফ্রেশ" : "Refresh"}
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>{isBn ? "API কী: " : "API key: "}{provider.has_api_key ? "✓" : "—"}</span>
        <span>{isBn ? "সিক্রেট কী: " : "Secret key: "}{provider.has_secret_key ? "✓" : "—"}</span>
        <span>{isBn ? "ওয়েবহুক: " : "Webhook: "}{provider.has_webhook_secret ? "✓" : "—"}</span>
      </div>

      {provider.webhook_secret && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-xs space-y-1">
          <p className="font-semibold text-green-700">
            {isBn ? "নিচের তথ্য Steadfast পোর্টালের Webhook Integration সেটিংসে যোগ করুন (একবারই দেখানো হবে):" : "Add these to Steadfast's Webhook Integration settings (shown only once):"}
          </p>
          <p><span className="text-gray-500">Callback Url:</span> <span className="font-mono">{WEBHOOK_URL}</span></p>
          <p><span className="text-gray-500">Auth Token (Bearer):</span> <span className="font-mono break-all">{provider.webhook_secret}</span></p>
        </div>
      )}

      {editing ? (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <FloatingInput
            label={isBn ? "API কী (নতুন হলে দিন)" : "API Key (enter to change)"}
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <FloatingInput
            label={isBn ? "সিক্রেট কী (নতুন হলে দিন)" : "Secret Key (enter to change)"}
            type="password"
            value={secretKey}
            onChange={e => setSecretKey(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handleSaveKeys} disabled={isLoading} className="btn-primary flex-1">
              {isBn ? "সংরক্ষণ করুন" : "Save"}
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary flex-1">
              {isBn ? "বাতিল" : "Cancel"}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="text-sm text-amber-700 hover:underline">
          {isBn ? "কী পরিবর্তন করুন" : "Update keys"}
        </button>
      )}
    </div>
  );
}

export default function ProvidersTab({ locale, isBn }: { locale: string; isBn: boolean }) {
  const { data: providers = [], isLoading } = useGetCourierProvidersQuery();
  const [create, { isLoading: creating }] = useCreateCourierProviderMutation();

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "Steadfast Courier", base_url: "https://portal.packzy.com/api/v1", api_key: "", secret_key: "" });

  const handleCreate = async () => {
    if (!form.api_key || !form.secret_key) {
      toast.error(isBn ? "API কী ও সিক্রেট কী আবশ্যক" : "API key and secret key are required");
      return;
    }
    try {
      await create({ code: "STEADFAST", name: form.name, base_url: form.base_url, api_key: form.api_key, secret_key: form.secret_key, is_active: true }).unwrap();
      toast.success(isBn ? "প্রোভাইডার যোগ হয়েছে" : "Provider added");
      setShowNew(false);
      setForm({ name: "Steadfast Courier", base_url: "https://portal.packzy.com/api/v1", api_key: "", secret_key: "" });
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed to add provider");
    }
  };

  return (
    <div className="space-y-4">
      {!showNew && (
        <button onClick={() => setShowNew(true)} className="btn-primary text-sm">
          + {isBn ? "প্রোভাইডার যোগ করুন" : "Add Provider"}
        </button>
      )}

      {showNew && (
        <div className="card space-y-3 max-w-xl">
          <h3 className="font-bold text-gray-800">{isBn ? "নতুন প্রোভাইডার (Steadfast)" : "New Provider (Steadfast)"}</h3>
          <FloatingInput label={isBn ? "নাম" : "Name"} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <FloatingInput label={isBn ? "বেস URL" : "Base URL"} value={form.base_url} onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))} />
          <FloatingInput label="API Key" type="password" value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))} />
          <FloatingInput label="Secret Key" type="password" value={form.secret_key} onChange={e => setForm(f => ({ ...f, secret_key: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1">
              {isBn ? "যোগ করুন" : "Add"}
            </button>
            <button onClick={() => setShowNew(false)} className="btn-secondary flex-1">
              {isBn ? "বাতিল" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">{isBn ? "লোড হচ্ছে..." : "Loading..."}</p>
      ) : providers.length === 0 && !showNew ? (
        <p className="text-sm text-gray-400">{isBn ? "কোনো কুরিয়ার প্রোভাইডার যোগ করা হয়নি" : "No courier provider configured yet"}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map(p => <ProviderCard key={p.id} provider={p} isBn={isBn} locale={locale} />)}
        </div>
      )}
    </div>
  );
}

"use client";

import {
  useCreateCourierProviderMutation,
  useGetCourierProviderBalanceQuery,
  useGetCourierProvidersQuery,
  useRegenerateWebhookSecretMutation,
  useUpdateCourierProviderMutation,
} from "@/api/courier/courierApi";
import { FloatingInput, FloatingSelect } from "@/components/ui/forms";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import { CourierProvider } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { formatAmount } from "@/utils/format";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

function CopyButton({ value, isBn }: { value: string; isBn: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title={isBn ? "কপি করুন" : "Copy"}
      className="inline-flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:text-amber-700 hover:bg-amber-100 transition-colors shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const WEBHOOK_URLS = {
  STEADFAST: `${API_ORIGIN}/api/courier/webhooks/steadfast/`,
  PATHAO:    `${API_ORIGIN}/api/courier/webhooks/pathao/`,
} as const;

// Provider-type presets — driving the "Add Provider" defaults and which
// credential fields each one actually needs (Steadfast: static API key/
// secret; Pathao: OAuth client id/secret + merchant login + store id).
const PROVIDER_TYPES = {
  STEADFAST: { name: "Steadfast Courier", base_url: "https://portal.packzy.com/api/v1" },
  PATHAO:    { name: "Pathao Courier",    base_url: "https://api-hermes.pathao.com" },
} as const;
type ProviderCode = keyof typeof PROVIDER_TYPES;

function ProviderCard({ provider, isBn, locale }: { provider: CourierProvider; isBn: boolean; locale: string }) {
  const isPathao = provider.code === "PATHAO";
  const [editing, setEditing] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [storeId, setStoreId] = useState(provider.store_id ?? "");
  const [webhookVerificationSecret, setWebhookVerificationSecret] = useState(provider.webhook_verification_secret ?? "");
  // The webhook secret only ever comes back in plaintext once, right when
  // it's (re)generated — the list endpoint never includes it, so this has
  // to be tracked in local state rather than read off `provider` directly.
  const [revealedSecret, setRevealedSecret] = useState(provider.webhook_secret ?? "");
  const [update, { isLoading }] = useUpdateCourierProviderMutation();
  const [regenerateSecret, { isLoading: regenerating }] = useRegenerateWebhookSecretMutation();
  const { data: balance, refetch: refetchBalance, isFetching: balanceLoading } = useGetCourierProviderBalanceQuery(provider.id, { skip: !provider.is_active || isPathao });

  const handleRegenerateSecret = async () => {
    try {
      const updated = await regenerateSecret(provider.id).unwrap();
      setRevealedSecret(updated.webhook_secret ?? "");
      toast.success(isBn ? "নতুন সিক্রেট তৈরি হয়েছে — এখনই কপি করে কুরিয়ারের ড্যাশবোর্ডে বসান" : "New secret generated — copy it into the courier's dashboard now");
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed to regenerate");
    }
  };

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
        ...(isPathao && username ? { username } : {}),
        ...(isPathao && password ? { password } : {}),
        ...(isPathao ? { store_id: storeId, webhook_verification_secret: webhookVerificationSecret } : {}),
      }).unwrap();
      toast.success(isBn ? "সংরক্ষণ হয়েছে" : "Saved");
      setApiKey("");
      setSecretKey("");
      setUsername("");
      setPassword("");
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

      {provider.is_active && !isPathao && (
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

      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
        <span>{isBn ? (isPathao ? "ক্লায়েন্ট আইডি: " : "API কী: ") : (isPathao ? "Client ID: " : "API key: ")}{provider.has_api_key ? "✓" : "—"}</span>
        <span>{isBn ? (isPathao ? "ক্লায়েন্ট সিক্রেট: " : "সিক্রেট কী: ") : (isPathao ? "Client secret: " : "Secret key: ")}{provider.has_secret_key ? "✓" : "—"}</span>
        {isPathao && (
          <>
            <span>{isBn ? "ইউজারনেম: " : "Username: "}{provider.has_username ? "✓" : "—"}</span>
            <span>{isBn ? "পাসওয়ার্ড: " : "Password: "}{provider.has_password ? "✓" : "—"}</span>
            <span>{isBn ? "স্টোর আইডি: " : "Store ID: "}{provider.store_id || "—"}</span>
          </>
        )}
        <span>{isBn ? "ওয়েবহুক: " : "Webhook: "}{provider.has_webhook_secret ? "✓" : "—"}</span>
        {isPathao && (
          <span>{isBn ? "ভেরিফিকেশন সিক্রেট: " : "Verification secret: "}{provider.webhook_verification_secret ? "✓" : "—"}</span>
        )}
        <button
          type="button"
          onClick={handleRegenerateSecret}
          disabled={regenerating}
          className="text-amber-700 hover:underline disabled:opacity-50"
        >
          {regenerating
            ? (isBn ? "তৈরি হচ্ছে..." : "Generating...")
            : (isBn ? "ওয়েবহুক সিক্রেট নতুন করে তৈরি করুন" : "Regenerate webhook secret")}
        </button>
      </div>

      {revealedSecret && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-xs space-y-1">
          <p className="font-semibold text-green-700">
            {isPathao
              ? (isBn ? "নিচের তথ্য Pathao পোর্টালের Webhook Integration সেটিংসে যোগ করুন (Auth Token একবারই দেখানো হবে):" : "Add these to Pathao's Webhook Integration settings (Auth Token shown only once):")
              : (isBn ? "নিচের তথ্য Steadfast পোর্টালের Webhook Integration সেটিংসে \"Auth Token (Bearer)\" ফিল্ডে বসান (একবারই দেখানো হবে):" : "Paste this into Steadfast's Webhook Integration \"Auth Token (Bearer)\" field (shown only once):")}
          </p>
          <p className="flex items-center gap-1.5">
            <span className="text-gray-500 shrink-0">Callback Url:</span>
            <span className="font-mono break-all">{WEBHOOK_URLS[provider.code as keyof typeof WEBHOOK_URLS] ?? WEBHOOK_URLS.STEADFAST}</span>
            <CopyButton value={WEBHOOK_URLS[provider.code as keyof typeof WEBHOOK_URLS] ?? WEBHOOK_URLS.STEADFAST} isBn={isBn} />
          </p>
          <p className="flex items-center gap-1.5">
            <span className="text-gray-500 shrink-0">{isPathao ? "Secret:" : "Auth Token (Bearer):"}</span>
            <span className="font-mono break-all">{revealedSecret}</span>
            <CopyButton value={revealedSecret} isBn={isBn} />
          </p>
        </div>
      )}

      {isPathao && (
        <p className="text-xs text-gray-400">
          {isBn
            ? "Pathao ওয়েবহুক যোগ করার সময় তাদের ড্যাশবোর্ডে যে ভেরিফিকেশন সিক্রেট দেখাবে, সেটি নিচে \"ভেরিফিকেশন সিক্রেট\" ফিল্ডে বসান — এটি ছাড়া তাদের ভেরিফিকেশন ধাপ ব্যর্থ হবে।"
            : "When adding the webhook in Pathao's dashboard, paste the verification secret it shows you into the \"Verification secret\" field below — without it, their verification step will fail."}
        </p>
      )}

      {editing ? (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <FloatingInput
            label={isPathao ? (isBn ? "ক্লায়েন্ট আইডি (নতুন হলে দিন)" : "Client ID (enter to change)") : (isBn ? "API কী (নতুন হলে দিন)" : "API Key (enter to change)")}
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <FloatingInput
            label={isPathao ? (isBn ? "ক্লায়েন্ট সিক্রেট (নতুন হলে দিন)" : "Client Secret (enter to change)") : (isBn ? "সিক্রেট কী (নতুন হলে দিন)" : "Secret Key (enter to change)")}
            type="password"
            value={secretKey}
            onChange={e => setSecretKey(e.target.value)}
          />
          {isPathao && (
            <>
              <FloatingInput
                label={isBn ? "ইউজারনেম (Pathao লগইন ইমেইল)" : "Username (Pathao login email)"}
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <FloatingInput
                label={isBn ? "পাসওয়ার্ড (নতুন হলে দিন)" : "Password (enter to change)"}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <FloatingInput
                label={isBn ? "স্টোর আইডি" : "Store ID"}
                value={storeId}
                onChange={e => setStoreId(e.target.value)}
                placeholder={isBn ? "Pathao মার্চেন্ট প্যানেল থেকে নিন" : "From Pathao's merchant panel"}
              />
              <FloatingInput
                label={isBn ? "ভেরিফিকেশন সিক্রেট" : "Verification secret"}
                value={webhookVerificationSecret}
                onChange={e => setWebhookVerificationSecret(e.target.value)}
                placeholder={isBn ? "Pathao ওয়েবহুক ড্যাশবোর্ডে যা দেখাবে" : "Shown on Pathao's webhook setup dashboard"}
              />
            </>
          )}
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
          {isBn ? "কী পরিবর্তন করুন" : "Update credentials"}
        </button>
      )}
    </div>
  );
}

export default function ProvidersTab({ locale, isBn }: { locale: string; isBn: boolean }) {
  const { data: providers = [], isLoading } = useGetCourierProvidersQuery();
  const [create, { isLoading: creating }] = useCreateCourierProviderMutation();

  const [showNew, setShowNew] = useState(false);
  const [providerType, setProviderType] = useState<ProviderCode>("STEADFAST");
  const [form, setForm] = useState<{ name: string; base_url: string; api_key: string; secret_key: string; username: string; password: string; store_id: string }>({
    name: PROVIDER_TYPES.STEADFAST.name,
    base_url: PROVIDER_TYPES.STEADFAST.base_url,
    api_key: "", secret_key: "", username: "", password: "", store_id: "",
  });
  const isPathao = providerType === "PATHAO";

  const handleTypeChange = (type: ProviderCode) => {
    setProviderType(type);
    setForm(f => ({ ...f, name: PROVIDER_TYPES[type].name, base_url: PROVIDER_TYPES[type].base_url }));
  };

  const handleCreate = async () => {
    if (!form.api_key || !form.secret_key) {
      toast.error(isBn ? "ক্লায়েন্ট/API কী ও সিক্রেট আবশ্যক" : "Client/API key and secret are required");
      return;
    }
    if (isPathao && (!form.username || !form.password || !form.store_id)) {
      toast.error(isBn ? "ইউজারনেম, পাসওয়ার্ড ও স্টোর আইডি আবশ্যক" : "Username, password, and store ID are required for Pathao");
      return;
    }
    try {
      await create({
        code: providerType,
        name: form.name,
        base_url: form.base_url,
        api_key: form.api_key,
        secret_key: form.secret_key,
        is_active: true,
        ...(isPathao ? { username: form.username, password: form.password, store_id: form.store_id } : {}),
      }).unwrap();
      toast.success(isBn ? "প্রোভাইডার যোগ হয়েছে" : "Provider added");
      setShowNew(false);
      setForm({ name: PROVIDER_TYPES.STEADFAST.name, base_url: PROVIDER_TYPES.STEADFAST.base_url, api_key: "", secret_key: "", username: "", password: "", store_id: "" });
      setProviderType("STEADFAST");
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
          <h3 className="font-bold text-gray-800">{isBn ? "নতুন প্রোভাইডার" : "New Provider"}</h3>
          <FloatingSelect
            label={isBn ? "কুরিয়ার" : "Courier"}
            value={providerType}
            onChange={val => handleTypeChange(val as ProviderCode)}
          >
            <option value="STEADFAST">Steadfast</option>
            <option value="PATHAO">Pathao</option>
          </FloatingSelect>
          <FloatingInput label={isBn ? "নাম" : "Name"} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <FloatingInput label={isBn ? "বেস URL" : "Base URL"} value={form.base_url} onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))} />
          <FloatingInput label={isPathao ? "Client ID" : "API Key"} type="password" value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))} />
          <FloatingInput label={isPathao ? "Client Secret" : "Secret Key"} type="password" value={form.secret_key} onChange={e => setForm(f => ({ ...f, secret_key: e.target.value }))} />
          {isPathao && (
            <>
              <FloatingInput
                label={isBn ? "ইউজারনেম (Pathao লগইন ইমেইল)" : "Username (Pathao login email)"}
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              />
              <FloatingInput
                label={isBn ? "পাসওয়ার্ড" : "Password"}
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <FloatingInput
                label={isBn ? "স্টোর আইডি" : "Store ID"}
                value={form.store_id}
                onChange={e => setForm(f => ({ ...f, store_id: e.target.value }))}
                placeholder={isBn ? "Pathao মার্চেন্ট প্যানেল থেকে নিন" : "From Pathao's merchant panel"}
              />
            </>
          )}
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

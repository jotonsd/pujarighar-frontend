"use client";

import {
  useGetAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
} from "@/api/accounting/accountingApi";
import Badge from "@/components/ui/Badge";
import { FloatingInput, FloatingSelect } from "@/components/ui/forms";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/skeletons";
import { Account } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { useAuthStore } from "@/store/authStore";
import { hasPermission } from "@/utils/permissions";
import { Pencil, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";

const ACCOUNT_TYPES: { value: Account["account_type"]; bn: string; en: string }[] = [
  { value: "ASSET",     bn: "সম্পদ",    en: "Asset" },
  { value: "LIABILITY", bn: "দায়",      en: "Liability" },
  { value: "EQUITY",    bn: "মূলধন",    en: "Equity" },
  { value: "REVENUE",   bn: "আয়",       en: "Revenue" },
  { value: "EXPENSE",   bn: "খরচ",      en: "Expense" },
];

const TYPE_BADGE: Record<Account["account_type"], "green" | "red" | "blue" | "purple" | "orange"> = {
  ASSET: "green",
  LIABILITY: "red",
  EQUITY: "purple",
  REVENUE: "blue",
  EXPENSE: "orange",
};

type CreateForm = { code: string; name_bn: string; name_en: string; account_type: Account["account_type"]; parent: string };
type EditForm   = { name_bn: string; name_en: string; account_type: Account["account_type"]; parent: string };

export default function ChartOfAccountsPage() {
  const locale  = useLocale();
  const isBn    = locale === "bn";
  const canEdit   = useAuthStore(s => hasPermission(s.user, 'accounting_chart', 'edit'));
  const canCreate = useAuthStore(s => hasPermission(s.user, 'accounting_chart', 'create'));

  const { data: accounts = [], isLoading } = useGetAccountsQuery({ includeInactive: true });
  const [createAccount, { isLoading: creating }] = useCreateAccountMutation();
  const [updateAccount] = useUpdateAccountMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({ code: "", name_bn: "", name_en: "", account_type: "ASSET", parent: "" });
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<EditForm>({ name_bn: "", name_en: "", account_type: "ASSET", parent: "" });

  const typeLabel = (t: Account["account_type"]) => {
    const found = ACCOUNT_TYPES.find(a => a.value === t);
    return found ? (isBn ? found.bn : found.en) : t;
  };

  const parentOptions = accounts.map(a => ({ value: a.id, label: `${a.code} — ${isBn ? a.name_bn : a.name_en}` }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.code.trim() || !createForm.name_bn.trim()) {
      toast.error(isBn ? "কোড ও বাংলা নাম আবশ্যক" : "Code and Bengali name are required");
      return;
    }
    try {
      await createAccount({
        code: createForm.code.trim(),
        name_bn: createForm.name_bn,
        name_en: createForm.name_en,
        account_type: createForm.account_type,
        parent: createForm.parent || null,
      }).unwrap();
      toast.success(isBn ? "হিসাব তৈরি হয়েছে" : "Account created");
      setCreateForm({ code: "", name_bn: "", name_en: "", account_type: "ASSET", parent: "" });
      setShowCreate(false);
    } catch {
      toast.error(isBn ? "তৈরি ব্যর্থ হয়েছে" : "Create failed");
    }
  };

  const startEdit = (account: Account) => {
    setEditingId(account.id);
    setEditForm({
      name_bn: account.name_bn,
      name_en: account.name_en,
      account_type: account.account_type,
      parent: account.parent ?? "",
    });
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateAccount({ id, ...editForm, parent: editForm.parent || null }).unwrap();
      toast.success(isBn ? "আপডেট হয়েছে" : "Updated");
      setEditingId(null);
    } catch {
      toast.error(isBn ? "আপডেট ব্যর্থ হয়েছে" : "Update failed");
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try { await updateAccount({ id, is_active: !current }).unwrap(); }
    catch { toast.error("Failed"); }
  };

  return (
    <div>
      <PageHeader
        title={isBn ? "একাউন্ট চার্ট" : "Chart of Accounts"}
        description={isBn ? "হিসাবের খাত তৈরি ও পরিচালনা করুন" : "Create and manage account heads"}
        {...(canCreate && { addLabel: showCreate ? (isBn ? "বাতিল" : "Cancel") : (isBn ? "নতুন হিসাব" : "New Account"), onAdd: () => setShowCreate(s => !s) })}
      />

      {showCreate && (
        <form onSubmit={handleCreate} className="card mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {isBn ? "নতুন হিসাব" : "New Account"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <FloatingInput
              label={isBn ? "কোড *" : "Code *"}
              value={createForm.code}
              onChange={e => setCreateForm(f => ({ ...f, code: e.target.value }))}
              required
            />
            <FloatingInput
              label={isBn ? "নাম (বাংলা) *" : "Name (BN) *"}
              value={createForm.name_bn}
              onChange={e => setCreateForm(f => ({ ...f, name_bn: e.target.value }))}
              required
            />
            <FloatingInput
              label={isBn ? "নাম (ইংরেজি)" : "Name (EN)"}
              value={createForm.name_en}
              onChange={e => setCreateForm(f => ({ ...f, name_en: e.target.value }))}
            />
            <FloatingSelect
              label={isBn ? "ধরন" : "Type"}
              value={createForm.account_type}
              onChange={v => setCreateForm(f => ({ ...f, account_type: v as Account["account_type"] }))}
              options={ACCOUNT_TYPES.map(t => ({ value: t.value, label: isBn ? t.bn : t.en }))}
              showClearButton={false}
            />
            <FloatingSelect
              label={isBn ? "প্যারেন্ট (ঐচ্ছিক)" : "Parent (optional)"}
              value={createForm.parent}
              onChange={v => setCreateForm(f => ({ ...f, parent: v }))}
              onClear={() => setCreateForm(f => ({ ...f, parent: "" }))}
              options={parentOptions}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" disabled={creating} className="btn-primary text-sm">
              {creating ? (isBn ? "তৈরি হচ্ছে..." : "Creating...") : (isBn ? "তৈরি করুন" : "Create")}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
              {isBn ? "বাতিল" : "Cancel"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <TableSkeleton columns={6} rows={6} />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50 border-b border-amber-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "কোড" : "Code"}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "নাম (বাংলা)" : "Name (BN)"}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "নাম (ইংরেজি)" : "Name (EN)"}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "ধরন" : "Type"}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "স্ট্যাটাস" : "Status"}</th>
                  {canEdit && <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "অ্যাকশন" : "Actions"}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.map(account => (
                  <>
                    <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{account.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">{account.name_bn}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{account.name_en}</td>
                      <td className="px-4 py-3">
                        <Badge variant={TYPE_BADGE[account.account_type]}>{typeLabel(account.account_type)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {canEdit
                          ? <ToggleSwitch checked={account.is_active} onChange={() => toggleActive(account.id, account.is_active)}
                              activeLabel={isBn ? "সক্রিয়" : "Active"} inactiveLabel={isBn ? "নিষ্ক্রিয়" : "Inactive"} />
                          : <Badge variant={account.is_active ? "green" : "red"}>{account.is_active ? (isBn ? "সক্রিয়" : "Active") : (isBn ? "নিষ্ক্রিয়" : "Inactive")}</Badge>}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => editingId === account.id ? setEditingId(null) : startEdit(account)}
                            title={editingId === account.id ? (isBn ? "বাতিল" : "Cancel") : (isBn ? "সম্পাদনা" : "Edit")}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${editingId === account.id ? "border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200" : "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"}`}
                          >
                            {editingId === account.id ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      )}
                    </tr>
                    {editingId === account.id && (
                      <tr key={`edit-${account.id}`} className="bg-amber-50">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="flex items-end gap-3 flex-wrap">
                            <div className="w-48">
                              <FloatingInput
                                label={isBn ? "নাম (বাংলা)" : "Name (BN)"}
                                value={editForm.name_bn}
                                onChange={e => setEditForm(f => ({ ...f, name_bn: e.target.value }))}
                              />
                            </div>
                            <div className="w-48">
                              <FloatingInput
                                label={isBn ? "নাম (ইংরেজি)" : "Name (EN)"}
                                value={editForm.name_en}
                                onChange={e => setEditForm(f => ({ ...f, name_en: e.target.value }))}
                              />
                            </div>
                            <div className="w-40">
                              <FloatingSelect
                                label={isBn ? "ধরন" : "Type"}
                                value={editForm.account_type}
                                onChange={v => setEditForm(f => ({ ...f, account_type: v as Account["account_type"] }))}
                                options={ACCOUNT_TYPES.map(t => ({ value: t.value, label: isBn ? t.bn : t.en }))}
                                showClearButton={false}
                              />
                            </div>
                            <div className="w-56">
                              <FloatingSelect
                                label={isBn ? "প্যারেন্ট (ঐচ্ছিক)" : "Parent (optional)"}
                                value={editForm.parent}
                                onChange={v => setEditForm(f => ({ ...f, parent: v }))}
                                onClear={() => setEditForm(f => ({ ...f, parent: "" }))}
                                options={parentOptions.filter(o => o.value !== account.id)}
                              />
                            </div>
                            <button onClick={() => handleUpdate(account.id)} className="btn-primary text-xs px-3 py-1.5">
                              {isBn ? "সংরক্ষণ" : "Save"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            {accounts.length === 0 && (
              <p className="text-center text-gray-400 py-8">
                {isBn ? "কোনো হিসাব নেই" : "No accounts found"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

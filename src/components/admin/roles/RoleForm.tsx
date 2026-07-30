"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { FloatingInput } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "@/store/toastStore";
import { Permission, Role } from "@/lib/types";
import {
  useGetPermissionsCatalogQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
} from "@/api/roles/rolesApi";

const ACTIONS: Permission["action"][] = ["view", "create", "edit"];
const ACTION_LABELS: Record<Permission["action"], { bn: string; en: string }> = {
  view: { bn: "দেখুন", en: "View" },
  create: { bn: "তৈরি", en: "Create" },
  edit: { bn: "সম্পাদনা", en: "Edit" },
  delete: { bn: "মুছুন", en: "Delete" },
};

function moduleLabel(perm: Permission, isBn: boolean): string {
  const full = isBn ? perm.label_bn : perm.label_en;
  return full.split(" — ")[0] ?? perm.module;
}

// Mirrors the admin nav menu's grouping (backend/api/views/user_views.py
// _nav_registry()) so the permission grid reads the same way the sidebar does.
const GROUPS: { bn: string; en: string; modules: string[] }[] = [
  { bn: "POS ও অর্ডার", en: "POS & Orders", modules: ["pos", "orders"] },
  { bn: "ড্যাশবোর্ড", en: "Dashboard", modules: ["dashboard_overview", "analytics", "courier"] },
  { bn: "পণ্য ব্যবস্থাপনা", en: "Product Management", modules: ["products", "packages", "categories", "brands", "discounts", "inventory_stock", "suppliers"] },
  { bn: "ব্যবহারকারী", en: "Users", modules: ["users_admin", "partners", "loans"] },
  { bn: "ফিন্যান্স", en: "Finance", modules: ["accounting_journal", "accounting_ledger", "accounting_profit_loss", "accounting_trial_balance", "accounting_sales_summary", "expenses", "delivery_charges", "cashback"] },
  { bn: "রিপোর্ট", en: "Reports", modules: ["reports_purchases", "reports_supplier_returns", "reports_supplier_outstanding", "reports_product_stock", "reports_income", "reports_expenses"] },
  { bn: "মার্কেটিং", en: "Marketing", modules: ["hero_slider", "banners", "blog", "promo_emails", "reviews"] },
  { bn: "অন্যান্য", en: "Other", modules: ["shipping_addresses", "site_settings"] },
];

interface Props {
  mode: "create" | "edit";
  role?: Role;
}

export default function RoleForm({ mode, role }: Props) {
  const locale = useLocale();
  const isBn = locale === "bn";
  const router = useRouter();
  const readOnly = !!role?.is_system;

  const [form, setForm] = useState({
    name_bn: role?.name_bn ?? "",
    name_en: role?.name_en ?? "",
  });
  const [selected, setSelected] = useState<Set<string>>(
    new Set((role?.permissions ?? []).map(p => p.id)),
  );

  const { data: catalog = [], isLoading } = useGetPermissionsCatalogQuery();
  const [createRole, { isLoading: creating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: updating }] = useUpdateRoleMutation();
  const saving = creating || updating;

  useEffect(() => {
    if (role) {
      setForm({ name_bn: role.name_bn, name_en: role.name_en });
      setSelected(new Set(role.permissions.map(p => p.id)));
    }
  }, [role]);

  const byModule = new Map<string, Permission[]>();
  for (const perm of catalog) {
    if (!byModule.has(perm.module)) byModule.set(perm.module, []);
    byModule.get(perm.module)!.push(perm);
  }

  const toggle = (permId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const toggleModule = (perms: Permission[]) => {
    const allSelected = perms.every(p => selected.has(p.id));
    setSelected(prev => {
      const next = new Set(prev);
      for (const p of perms) {
        if (allSelected) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (readOnly) return;
    if (!form.name_bn || !form.name_en) {
      toast.error(isBn ? "নাম আবশ্যিক" : "Name is required");
      return;
    }
    try {
      const permission_ids = Array.from(selected);
      if (mode === "create") {
        await createRole({ ...form, permission_ids }).unwrap();
        toast.success(isBn ? "রোল তৈরি হয়েছে" : "Role created");
      } else if (role) {
        await updateRole({ id: role.id, ...form, permission_ids }).unwrap();
        toast.success(isBn ? "রোল আপডেট হয়েছে" : "Role updated");
      }
      router.push(`/${locale}/admin/roles`);
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e.data?.message ?? (isBn ? "ব্যর্থ হয়েছে" : "Failed"));
    }
  };

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={
          readOnly
            ? (isBn ? "রোল দেখুন" : "View Role")
            : mode === "create" ? (isBn ? "নতুন রোল" : "New Role") : (isBn ? "রোল সম্পাদনা" : "Edit Role")
        }
        description={
          readOnly
            ? (isBn ? "এটি একটি সিস্টেম রোল — শুধুমাত্র দেখা যাবে, সম্পাদনা করা যাবে না" : "This is a system role — view only, cannot be edited")
            : (isBn ? "নাম দিন এবং কোন মেনু ও অ্যাকশন এই রোল দেখতে/করতে পারবে তা নির্বাচন করুন" : "Name the role and choose which menus and actions it can access")
        }
        showBack
        backHref={`/${locale}/admin/roles`}
      />

      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FloatingInput
            label={isBn ? "নাম (বাংলা) *" : "Name (Bangla) *"}
            value={form.name_bn}
            onChange={e => setForm(p => ({ ...p, name_bn: e.target.value }))}
            disabled={readOnly}
          />
          <FloatingInput
            label="Name (English) *"
            value={form.name_en}
            onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))}
            disabled={readOnly}
          />
        </div>

        <div className="pt-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">
            {isBn ? "পারমিশন" : "Permissions"}
          </h3>

          {isLoading ? (
            <p className="text-sm text-gray-400">{isBn ? "লোড হচ্ছে..." : "Loading..."}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase">
                      {isBn ? "মডিউল" : "Module"}
                    </th>
                    {ACTIONS.map(action => (
                      <th key={action} className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                        {isBn ? ACTION_LABELS[action].bn : ACTION_LABELS[action].en}
                      </th>
                    ))}
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                      {isBn ? "সব নির্বাচন" : "Select All"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {GROUPS.map(group => {
                    const rows = group.modules
                      .map(module => ({ module, perms: byModule.get(module) }))
                      .filter((r): r is { module: string; perms: Permission[] } => !!r.perms);
                    if (rows.length === 0) return null;
                    return (
                      <>
                        <tr key={`group-${group.en}`} className="bg-gray-50">
                          <td colSpan={ACTIONS.length + 2} className="py-1.5 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {isBn ? group.bn : group.en}
                          </td>
                        </tr>
                        {rows.map(({ module, perms }) => (
                          <tr key={module}>
                            <td className="py-2 pr-4 pl-2 text-gray-700 font-medium">
                              {moduleLabel(perms[0], isBn)}
                            </td>
                            {ACTIONS.map(action => {
                              const perm = perms.find(p => p.action === action);
                              return (
                                <td key={action} className="text-center py-2 px-3">
                                  {perm ? (
                                    <input
                                      type="checkbox"
                                      checked={selected.has(perm.id)}
                                      onChange={() => toggle(perm.id)}
                                      disabled={readOnly}
                                      className="w-4 h-4 accent-amber-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                  ) : (
                                    <span className="text-gray-200">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="text-center py-2 px-3">
                              <input
                                type="checkbox"
                                checked={perms.every(p => selected.has(p.id))}
                                onChange={() => toggleModule(perms)}
                                disabled={readOnly}
                                title={isBn ? "সব নির্বাচন" : "Select all"}
                                className="w-4 h-4 accent-amber-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                              />
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {!readOnly && (
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save")}
            </button>
          )}
          <button onClick={() => router.back()} className="btn-secondary">
            {readOnly ? (isBn ? "ফিরে যান" : "Back") : (isBn ? "বাতিল" : "Cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

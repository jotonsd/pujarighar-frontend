"use client";

import {
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from "@/api/categories/categoriesApi";
import Badge from "@/components/ui/Badge";
import { FloatingInput } from "@/components/ui/forms";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/skeletons";
import CategoryCreateForm from "@/components/admin/categories/CategoryCreateForm";
import { Category } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { useAuthStore } from "@/store/authStore";
import { Pencil, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

type EditForm = { name_bn: string; name_en: string };

export default function CategoriesPage() {
  const t       = useTranslations();
  const locale  = useLocale();
  const isAdmin = useAuthStore(s => s.user?.role === 'ADMIN');

  const { data: categories = [], isLoading } = useGetCategoriesQuery({ includeInactive: true });
  const [updateCategory] = useUpdateCategoryMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<EditForm>({ name_bn: "", name_en: "" });

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditForm({ name_bn: cat.name_bn, name_en: cat.name_en });
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateCategory({ id, ...editForm }).unwrap();
      toast.success(locale === "bn" ? "আপডেট হয়েছে" : "Updated");
      setEditingId(null);
    } catch {
      toast.error(locale === "bn" ? "আপডেট ব্যর্থ হয়েছে" : "Update failed");
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try { await updateCategory({ id, is_active: !current }).unwrap() }
    catch { toast.error("Failed") }
  };

  return (
    <div>
      <PageHeader
        title={locale === "bn" ? "কেটাগরি" : "Categories"}
        description={locale === "bn" ? "পণ্যের কেটাগরি তৈরি ও পরিচালনা করুন" : "Create and manage product categories"}
        {...(isAdmin && { addLabel: showCreate ? t("common.cancel") : t("common.create"), onAdd: () => setShowCreate(s => !s) })} />

      {showCreate && (
        <CategoryCreateForm onClose={() => setShowCreate(false)} />
      )}

      {isLoading ? (
        <TableSkeleton columns={5} rows={6} />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50 border-b border-amber-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{locale === "bn" ? "নাম (বাংলা)" : "Name (BN)"}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{locale === "bn" ? "নাম (ইংরেজি)" : "Name (EN)"}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">Status</th>
                  {isAdmin && <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map(cat => (
                  <>
                    <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">{cat.name_bn}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cat.name_en}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{cat.slug}</td>
                      <td className="px-4 py-3">
                        {isAdmin
                          ? <ToggleSwitch checked={cat.is_active} onChange={() => toggleActive(cat.id, cat.is_active)}
                              activeLabel={t("common.active")} inactiveLabel={t("common.inactive")} />
                          : <Badge variant={cat.is_active ? "green" : "red"}>{cat.is_active ? t("common.active") : t("common.inactive")}</Badge>}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => editingId === cat.id ? setEditingId(null) : startEdit(cat)}
                            title={editingId === cat.id ? t("common.cancel") : t("common.edit")}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${editingId === cat.id ? "border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200" : "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"}`}>
                            {editingId === cat.id ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      )}
                    </tr>
                    {editingId === cat.id && (
                      <tr key={`edit-${cat.id}`} className="bg-amber-50">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="flex items-end gap-3 flex-wrap">
                            <div className="w-48">
                              <FloatingInput label="নাম (বাংলা)" value={editForm.name_bn}
                                onChange={e => setEditForm(f => ({ ...f, name_bn: e.target.value }))} />
                            </div>
                            <div className="w-48">
                              <FloatingInput label="Name (English)" value={editForm.name_en}
                                onChange={e => setEditForm(f => ({ ...f, name_en: e.target.value }))} />
                            </div>
                            <button onClick={() => handleUpdate(cat.id)} className="btn-primary text-xs px-3 py-1.5">
                              {t("common.save")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            {categories.length === 0 && <p className="text-center text-gray-400 py-8">{t("common.noData")}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

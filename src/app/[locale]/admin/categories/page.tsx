"use client";

import {
  useCreateCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from "@/api/categories/categoriesApi";
import { FloatingInput, ToggleSwitch } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { Category } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { Pencil, RefreshCw, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";

type CreateForm = { name_bn: string; name_en: string; slug: string };
type EditForm = { name_bn: string; name_en: string };

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function CategoriesPage() {
  const t = useTranslations();
  const locale = useLocale();

  const { data: categories = [], isLoading } = useGetCategoriesQuery({
    includeInactive: true,
  });
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();

  const slugManualRef = useRef(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    name_bn: "",
    name_en: "",
    slug: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name_bn: "",
    name_en: "",
  });

  const handleCreate = async () => {
    if (!createForm.name_bn || !createForm.name_en || !createForm.slug) {
      toast.error(
        locale === "bn" ? "সব ফিল্ড পূরণ করুন" : "All fields are required",
      );
      return;
    }
    try {
      await createCategory(createForm).unwrap();
      toast.success(
        locale === "bn" ? "কেটাগরি তৈরি হয়েছে" : "Category created",
      );
      setCreateForm({ name_bn: "", name_en: "", slug: "" });
      slugManualRef.current = false;
      setShowCreate(false);
    } catch (err: unknown) {
      const e = err as {
        data?: { error?: { message_en?: string; message_bn?: string } };
      };
      toast.error(
        locale === "bn"
          ? (e.data?.error?.message_bn ?? "ব্যর্থ হয়েছে")
          : (e.data?.error?.message_en ?? "Failed"),
      );
    }
  };

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
    try {
      await updateCategory({ id, is_active: !current }).unwrap();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div>
      <PageHeader
        title={locale === "bn" ? "কেটাগরি" : "Categories"}
        addLabel={showCreate ? t("common.cancel") : t("common.create")}
        onAdd={() => setShowCreate(s => !s)}
      />

      {showCreate && (
        <div className="card mb-4 space-y-3">
          <h2 className="font-medium text-gray-700">
            {locale === "bn" ? "নতুন কেটাগরি" : "New Category"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FloatingInput
              label="নাম (বাংলা) *"
              value={createForm.name_bn}
              onChange={e =>
                setCreateForm(f => ({ ...f, name_bn: e.target.value }))
              }
            />
            <FloatingInput
              label="Name (English) *"
              value={createForm.name_en}
              onChange={e => {
                const val = e.target.value;
                setCreateForm(f => ({
                  ...f,
                  name_en: val,
                  ...(!slugManualRef.current && { slug: slugify(val) }),
                }));
              }}
            />
            <div className="flex gap-2 items-start">
              <FloatingInput
                label="Slug *"
                value={createForm.slug}
                onChange={e => {
                  slugManualRef.current = true;
                  setCreateForm(f => ({ ...f, slug: e.target.value }));
                }}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  slugManualRef.current = false;
                  setCreateForm(f => ({ ...f, slug: slugify(f.name_en) }));
                }}
                title={locale === "bn" ? "পুনরায় তৈরি করুন" : "Regenerate slug"}
                className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:text-amber-600 hover:border-amber-400 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="btn-primary text-sm"
            >
              {creating ? t("common.loading") : t("common.create")}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="btn-secondary text-sm"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton columns={5} rows={6} />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50 border-b border-amber-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                    {locale === "bn" ? "নাম (বাংলা)" : "Name (BN)"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                    {locale === "bn" ? "নাম (ইংরেজি)" : "Name (EN)"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map(cat => (
                  <>
                    <tr
                      key={cat.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                        {cat.name_bn}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {cat.name_en}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">
                        {cat.slug}
                      </td>
                      <td className="px-4 py-3">
                        <ToggleSwitch
                          checked={cat.is_active}
                          onChange={() => toggleActive(cat.id, cat.is_active)}
                          activeLabel={t("common.active")}
                          inactiveLabel={t("common.inactive")}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            editingId === cat.id
                              ? setEditingId(null)
                              : startEdit(cat)
                          }
                          title={
                            editingId === cat.id
                              ? t("common.cancel")
                              : t("common.edit")
                          }
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                            editingId === cat.id
                              ? "border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200"
                              : "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                          }`}
                        >
                          {editingId === cat.id ? (
                            <X className="w-3.5 h-3.5" />
                          ) : (
                            <Pencil className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {editingId === cat.id && (
                      <tr key={`edit-${cat.id}`} className="bg-amber-50">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="flex items-end gap-3 flex-wrap">
                            <div className="w-48">
                              <FloatingInput
                                label="নাম (বাংলা)"
                                value={editForm.name_bn}
                                onChange={e =>
                                  setEditForm(f => ({
                                    ...f,
                                    name_bn: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="w-48">
                              <FloatingInput
                                label="Name (English)"
                                value={editForm.name_en}
                                onChange={e =>
                                  setEditForm(f => ({
                                    ...f,
                                    name_en: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <button
                              onClick={() => handleUpdate(cat.id)}
                              className="btn-primary text-xs px-3 py-1.5"
                            >
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
            {categories.length === 0 && (
              <p className="text-center text-gray-400 py-8">
                {t("common.noData")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

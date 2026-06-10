"use client";

import {
  useGetBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} from "@/api/brands/brandsApi";
import { FloatingInput } from "@/components/ui/forms";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/skeletons";
import { Brand } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { Pencil, Trash2, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";

type CreateForm = { name_bn: string; name_en: string; slug: string };
type EditForm   = { name_bn: string; name_en: string };

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function BrandsPage() {
  const locale = useLocale();
  const isBn   = locale === "bn";

  const { data: brands = [], isLoading } = useGetBrandsQuery({ includeInactive: true });
  const [createBrand, { isLoading: creating }] = useCreateBrandMutation();
  const [updateBrand]                          = useUpdateBrandMutation();
  const [deleteBrand]                          = useDeleteBrandMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({ name_bn: "", name_en: "", slug: "" });
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<EditForm>({ name_bn: "", name_en: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name_bn.trim()) {
      toast.error(isBn ? "বাংলা নাম আবশ্যক" : "Bengali name is required");
      return;
    }
    const fd = new FormData();
    fd.append("name_bn", createForm.name_bn);
    fd.append("name_en", createForm.name_en);
    fd.append("slug", createForm.slug || slugify(createForm.name_en || createForm.name_bn));
    try {
      await createBrand(fd).unwrap();
      toast.success(isBn ? "ব্র্যান্ড তৈরি হয়েছে" : "Brand created");
      setCreateForm({ name_bn: "", name_en: "", slug: "" });
      setShowCreate(false);
    } catch {
      toast.error(isBn ? "তৈরি ব্যর্থ হয়েছে" : "Create failed");
    }
  };

  const startEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setEditForm({ name_bn: brand.name_bn, name_en: brand.name_en });
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateBrand({ id, data: editForm }).unwrap();
      toast.success(isBn ? "আপডেট হয়েছে" : "Updated");
      setEditingId(null);
    } catch {
      toast.error(isBn ? "আপডেট ব্যর্থ হয়েছে" : "Update failed");
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try { await updateBrand({ id, data: { is_active: !current } }).unwrap(); }
    catch { toast.error("Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isBn ? "এই ব্র্যান্ডটি মুছে ফেলবেন?" : "Delete this brand?")) return;
    try {
      await deleteBrand(id).unwrap();
      toast.success(isBn ? "মুছে ফেলা হয়েছে" : "Deleted");
    } catch {
      toast.error(isBn ? "মুছতে ব্যর্থ হয়েছে" : "Delete failed");
    }
  };

  return (
    <div>
      <PageHeader
        title={isBn ? "ব্র্যান্ড" : "Brands"}
        description={isBn ? "পণ্যের ব্র্যান্ড তৈরি ও পরিচালনা করুন" : "Create and manage product brands"}
        addLabel={showCreate ? (isBn ? "বাতিল" : "Cancel") : (isBn ? "নতুন ব্র্যান্ড" : "New Brand")}
        onAdd={() => setShowCreate(s => !s)}
      />

      {showCreate && (
        <form onSubmit={handleCreate} className="card mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {isBn ? "নতুন ব্র্যান্ড" : "New Brand"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FloatingInput
              label={isBn ? "নাম (বাংলা) *" : "Name (BN) *"}
              value={createForm.name_bn}
              onChange={e => setCreateForm(f => ({ ...f, name_bn: e.target.value }))}
              required
            />
            <FloatingInput
              label={isBn ? "নাম (ইংরেজি)" : "Name (EN)"}
              value={createForm.name_en}
              onChange={e => setCreateForm(f => ({
                ...f,
                name_en: e.target.value,
                slug: slugify(e.target.value),
              }))}
            />
            <FloatingInput
              label="Slug"
              value={createForm.slug}
              onChange={e => setCreateForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="auto-generated"
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
        <TableSkeleton columns={4} rows={5} />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-amber-50 border-b border-amber-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "নাম (বাংলা)" : "Name (BN)"}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "নাম (ইংরেজি)" : "Name (EN)"}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "স্ট্যাটাস" : "Status"}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 uppercase tracking-wider">{isBn ? "অ্যাকশন" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {brands.map(brand => (
                  <>
                    <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">{brand.name_bn}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{brand.name_en}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{brand.slug}</td>
                      <td className="px-4 py-3">
                        <ToggleSwitch
                          checked={brand.is_active}
                          onChange={() => toggleActive(brand.id, brand.is_active)}
                          activeLabel={isBn ? "সক্রিয়" : "Active"}
                          inactiveLabel={isBn ? "নিষ্ক্রিয়" : "Inactive"}
                        />
                      </td>
                      <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => editingId === brand.id ? setEditingId(null) : startEdit(brand)}
                          title={editingId === brand.id ? (isBn ? "বাতিল" : "Cancel") : (isBn ? "সম্পাদনা" : "Edit")}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${editingId === brand.id ? "border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200" : "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"}`}
                        >
                          {editingId === brand.id ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          title={isBn ? "মুছুন" : "Delete"}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                    {editingId === brand.id && (
                      <tr key={`edit-${brand.id}`} className="bg-amber-50">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="flex items-end gap-3 flex-wrap">
                            <div className="w-48">
                              <FloatingInput
                                label="নাম (বাংলা)"
                                value={editForm.name_bn}
                                onChange={e => setEditForm(f => ({ ...f, name_bn: e.target.value }))}
                              />
                            </div>
                            <div className="w-48">
                              <FloatingInput
                                label="Name (English)"
                                value={editForm.name_en}
                                onChange={e => setEditForm(f => ({ ...f, name_en: e.target.value }))}
                              />
                            </div>
                            <button onClick={() => handleUpdate(brand.id)} className="btn-primary text-xs px-3 py-1.5">
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
            {brands.length === 0 && (
              <p className="text-center text-gray-400 py-8">
                {isBn ? "কোনো ব্র্যান্ড নেই" : "No brands found"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import {
  useGetAttributeTypesQuery,
  useCreateAttributeTypeMutation,
  useUpdateAttributeTypeMutation,
  useDeleteAttributeTypeMutation,
  useGetAttributeValuesQuery,
  useCreateAttributeValueMutation,
  useUpdateAttributeValueMutation,
  useDeleteAttributeValueMutation,
} from "@/api/products/productsApi";
import Badge from "@/components/ui/Badge";
import { FloatingInput } from "@/components/ui/forms";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import PageHeader from "@/components/ui/PageHeader";
import TableSkeleton from "@/components/ui/skeletons";
import { VariantAttributeType, VariantAttributeValue } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { getErrorMessage } from "@/utils/apiError";
import { useAuthStore } from "@/store/authStore";
import { hasPermission } from "@/utils/permissions";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";

type CreateTypeForm = { name_bn: string; name_en: string; code: string; has_bilingual_values: boolean };

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// Manages the reusable attribute-type/value library a product's Variants
// panel picks from — a new type here (e.g. "Weight") is immediately usable
// on any product's Variants section with zero code changes, which is the
// whole point of the generic design.
export default function AttributeTypesPage() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const isAdmin = useAuthStore(s => hasPermission(s.user, "products", "edit"));
  const canDelete = useAuthStore(s => s.user?.role.code === "ADMIN");

  const { data: types = [], isLoading } = useGetAttributeTypesQuery({ includeInactive: true });
  const [createType, { isLoading: creating }] = useCreateAttributeTypeMutation();
  const [updateType] = useUpdateAttributeTypeMutation();
  const [deleteType] = useDeleteAttributeTypeMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTypeForm>({ name_bn: "", name_en: "", code: "", has_bilingual_values: false });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name_bn: "", name_en: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name_bn.trim() || !createForm.name_en.trim() || !createForm.code.trim()) {
      toast.error(isBn ? "সব তথ্য আবশ্যক" : "All fields are required");
      return;
    }
    try {
      await createType({
        name_bn: createForm.name_bn,
        name_en: createForm.name_en,
        code: createForm.code || slugify(createForm.name_en),
        has_bilingual_values: createForm.has_bilingual_values,
      }).unwrap();
      toast.success(isBn ? "ধরন তৈরি হয়েছে" : "Type created");
      setCreateForm({ name_bn: "", name_en: "", code: "", has_bilingual_values: false });
      setShowCreate(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  const startEdit = (type: VariantAttributeType) => {
    setEditingId(type.id);
    setEditForm({ name_bn: type.name_bn, name_en: type.name_en });
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateType({ id, ...editForm }).unwrap();
      toast.success(isBn ? "আপডেট হয়েছে" : "Updated");
      setEditingId(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  const toggleActive = async (type: VariantAttributeType) => {
    try {
      await updateType({ id: type.id, is_active: !type.is_active }).unwrap();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isBn ? "এই ধরনটি মুছে ফেলবেন?" : "Delete this attribute type?")) return;
    try {
      await deleteType(id).unwrap();
      toast.success(isBn ? "মুছে ফেলা হয়েছে" : "Deleted");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  return (
    <div>
      <PageHeader
        title={isBn ? "ভ্যারিয়েন্ট ধরন" : "Attribute Types"}
        description={
          isBn
            ? "রং, সাইজ ইত্যাদি ভ্যারিয়েন্ট ধরন ও তাদের মান পরিচালনা করুন"
            : "Manage variant attribute types (Color, Size, etc.) and their reusable values"
        }
        {...(isAdmin && {
          addLabel: showCreate ? (isBn ? "বাতিল" : "Cancel") : (isBn ? "নতুন ধরন" : "New Type"),
          onAdd: () => setShowCreate(s => !s),
        })}
      />

      {showCreate && (
        <form onSubmit={handleCreate} className="card mb-4">
          <h3 className="text-sm font-semibold text-muted mb-3">{isBn ? "নতুন ধরন" : "New Type"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FloatingInput
              label={isBn ? "নাম (বাংলা) *" : "Name (BN) *"}
              value={createForm.name_bn}
              onChange={e => setCreateForm(f => ({ ...f, name_bn: e.target.value }))}
              required
            />
            <FloatingInput
              label={isBn ? "নাম (ইংরেজি) *" : "Name (EN) *"}
              value={createForm.name_en}
              onChange={e => setCreateForm(f => ({ ...f, name_en: e.target.value, code: slugify(e.target.value) }))}
              required
            />
            <FloatingInput
              label="Code *"
              value={createForm.code}
              onChange={e => setCreateForm(f => ({ ...f, code: slugify(e.target.value) }))}
              placeholder="color, size, weight..."
              required
            />
          </div>
          <label className="flex items-center gap-2 mt-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={createForm.has_bilingual_values}
              onChange={e => setCreateForm(f => ({ ...f, has_bilingual_values: e.target.checked }))}
            />
            {isBn
              ? "মানগুলো বাংলা ও ইংরেজি দুটোই লাগবে (যেমন: রং)"
              : "Values need both Bangla and English (e.g. Color)"}
          </label>
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
        <TableSkeleton columns={5} rows={3} />
      ) : (
        <div className="space-y-3">
          {types.map(type => (
            <div key={type.id} className="bg-surface rounded-lg shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === type.id ? null : type.id)}
                  className="text-muted hover:text-body"
                >
                  {expandedId === type.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {editingId === type.id ? (
                  <div className="flex items-end gap-3 flex-1 flex-wrap">
                    <div className="w-44">
                      <FloatingInput label={isBn ? "নাম (বাংলা)" : "Name (BN)"} value={editForm.name_bn} onChange={e => setEditForm(f => ({ ...f, name_bn: e.target.value }))} />
                    </div>
                    <div className="w-44">
                      <FloatingInput label="Name (EN)" value={editForm.name_en} onChange={e => setEditForm(f => ({ ...f, name_en: e.target.value }))} />
                    </div>
                    <button onClick={() => handleUpdate(type.id)} className="btn-primary text-xs px-3 py-1.5">
                      {isBn ? "সংরক্ষণ" : "Save"}
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-body">{isBn ? type.name_bn : type.name_en}</span>
                    <span className="font-mono text-xs text-muted">{type.code}</span>
                    {type.has_bilingual_values && (
                      <Badge variant="blue">{isBn ? "দ্বিভাষিক" : "Bilingual"}</Badge>
                    )}
                  </div>
                )}
                {isAdmin ? (
                  <ToggleSwitch
                    checked={type.is_active}
                    onChange={() => toggleActive(type)}
                    activeLabel={isBn ? "সক্রিয়" : "Active"}
                    inactiveLabel={isBn ? "নিষ্ক্রিয়" : "Inactive"}
                  />
                ) : (
                  <Badge variant={type.is_active ? "green" : "red"}>{type.is_active ? (isBn ? "সক্রিয়" : "Active") : (isBn ? "নিষ্ক্রিয়" : "Inactive")}</Badge>
                )}
                {isAdmin && (
                  <button
                    onClick={() => editingId === type.id ? setEditingId(null) : startEdit(type)}
                    title={isBn ? "সম্পাদনা" : "Edit"}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${editingId === type.id ? "border-border bg-surface-alt text-muted hover:bg-border" : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"}`}
                  >
                    {editingId === type.id ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(type.id)}
                    title={isBn ? "মুছুন" : "Delete"}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {expandedId === type.id && (
                <div className="border-t border-border px-4 py-3 bg-background">
                  <AttributeValuesEditor type={type} locale={locale} isAdmin={isAdmin} canDelete={canDelete} />
                </div>
              )}
            </div>
          ))}
          {types.length === 0 && (
            <p className="text-center text-muted py-8">{isBn ? "কোনো ধরন নেই" : "No attribute types found"}</p>
          )}
        </div>
      )}
    </div>
  );
}

function AttributeValuesEditor({
  type,
  locale,
  isAdmin,
  canDelete,
}: {
  type: VariantAttributeType;
  locale: string;
  isAdmin: boolean;
  canDelete: boolean;
}) {
  const isBn = locale === "bn";
  const { data: values = [], isLoading } = useGetAttributeValuesQuery({ attribute_type_id: type.id, includeInactive: true });
  const [createValue, { isLoading: creating }] = useCreateAttributeValueMutation();
  const [updateValue] = useUpdateAttributeValueMutation();
  const [deleteValue] = useDeleteAttributeValueMutation();

  const [newBn, setNewBn] = useState("");
  const [newEn, setNewEn] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ value_bn: "", value_en: "" });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const en = newEn.trim();
    const bn = newBn.trim();
    if (!en && !bn) return;
    try {
      await createValue({ attribute_type_id: type.id, value_bn: bn, value_en: en || bn }).unwrap();
      setNewBn("");
      setNewEn("");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  const startEdit = (value: VariantAttributeValue) => {
    setEditingId(value.id);
    setEditForm({ value_bn: value.value_bn, value_en: value.value_en });
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateValue({ id, ...editForm }).unwrap();
      setEditingId(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  const toggleActive = async (value: VariantAttributeValue) => {
    try {
      await updateValue({ id: value.id, is_active: !value.is_active }).unwrap();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isBn ? "এই মানটি মুছে ফেলবেন?" : "Delete this value?")) return;
    try {
      await deleteValue(id).unwrap();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
    }
  };

  if (isLoading) return <p className="text-sm text-muted">{isBn ? "লোড হচ্ছে..." : "Loading..."}</p>;

  return (
    <div className="space-y-2">
      {values.map(value => (
        <div key={value.id} className="flex items-center gap-3 text-sm">
          {editingId === value.id ? (
            <>
              {type.has_bilingual_values && (
                <input
                  value={editForm.value_bn}
                  onChange={e => setEditForm(f => ({ ...f, value_bn: e.target.value }))}
                  className="w-28 px-2 py-1 rounded border border-border bg-background text-body text-xs"
                  placeholder="বাংলা"
                />
              )}
              <input
                value={editForm.value_en}
                onChange={e => setEditForm(f => ({ ...f, value_en: e.target.value }))}
                className="w-28 px-2 py-1 rounded border border-border bg-background text-body text-xs"
                placeholder="English"
              />
              <button onClick={() => handleUpdate(value.id)} className="btn-primary text-xs px-2 py-1">
                {isBn ? "সংরক্ষণ" : "Save"}
              </button>
              <button onClick={() => setEditingId(null)} className="text-muted text-xs">
                {isBn ? "বাতিল" : "Cancel"}
              </button>
            </>
          ) : (
            <>
              <span className="flex-1">{isBn ? (value.value_bn || value.value_en) : (value.value_en || value.value_bn)}</span>
              {isAdmin && (
                <ToggleSwitch checked={value.is_active} onChange={() => toggleActive(value)} activeLabel={isBn ? "সক্রিয়" : "Active"} inactiveLabel={isBn ? "নিষ্ক্রিয়" : "Inactive"} />
              )}
              {isAdmin && (
                <button onClick={() => startEdit(value)} className="text-muted hover:text-amber-700">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {canDelete && (
                <button onClick={() => handleDelete(value.id)} className="text-muted hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      ))}
      {values.length === 0 && <p className="text-xs text-muted">{isBn ? "কোনো মান নেই" : "No values yet"}</p>}

      {isAdmin && (
        <form onSubmit={handleAdd} className="flex items-center gap-2 pt-2">
          {type.has_bilingual_values && (
            <input
              value={newBn}
              onChange={e => setNewBn(e.target.value)}
              placeholder={isBn ? "বাংলা" : "Bangla"}
              className="w-28 px-2 py-1 rounded border border-border bg-background text-body text-xs"
            />
          )}
          <input
            value={newEn}
            onChange={e => setNewEn(e.target.value)}
            placeholder={isBn ? "নতুন মান" : "New value"}
            className="w-28 px-2 py-1 rounded border border-border bg-background text-body text-xs"
          />
          <button type="submit" disabled={creating} className="btn-secondary text-xs px-2 py-1 inline-flex items-center gap-1">
            <Plus className="w-3 h-3" />
            {isBn ? "যোগ করুন" : "Add"}
          </button>
        </form>
      )}
    </div>
  );
}

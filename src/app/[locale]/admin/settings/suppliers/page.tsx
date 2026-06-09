"use client";

import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
} from "@/api/suppliers/suppliersApi";
import { FloatingInput, FloatingTextarea } from "@/components/ui/forms";
import ToggleSwitch from "@/components/ui/forms/ToggleSwitch";
import PageHeader from "@/components/ui/PageHeader";
import { ReusableTable, Column, QuickAction } from "@/components/ui/ReusableTable";
import { Supplier } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { Pencil, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";

const EMPTY: Partial<Supplier> = { name_bn: "", name_en: "", phone: "", address: "" };

export default function SuppliersPage() {
  const locale = useLocale();
  const isBn = locale === "bn";

  const { data: suppliers = [], isLoading } = useGetSuppliersQuery({ includeInactive: true });
  const [createSupplier, { isLoading: creating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: updating }] = useUpdateSupplierMutation();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Partial<Supplier>>(EMPTY);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name_bn: s.name_bn, name_en: s.name_en, phone: s.phone, address: s.address });
    setShowForm(true);
  };
  const close = () => { setShowForm(false); setEditing(null); setForm(EMPTY); };

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name_bn) { toast.error(isBn ? "নাম (বাংলা) আবশ্যক" : "Bangla name required"); return; }
    try {
      if (editing) {
        await updateSupplier({ id: editing.id, ...form }).unwrap();
        toast.success(isBn ? "আপডেট হয়েছে" : "Updated");
      } else {
        await createSupplier(form).unwrap();
        toast.success(isBn ? "সরবরাহকারী তৈরি হয়েছে" : "Supplier created");
      }
      close();
    } catch { toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed"); }
  };

  const toggleActive = async (s: Supplier) => {
    try {
      await updateSupplier({ id: s.id, is_active: !s.is_active }).unwrap();
    } catch { toast.error(isBn ? "ব্যর্থ" : "Failed"); }
  };

  const columns: Column<Supplier>[] = [
    {
      header: isBn ? "নাম" : "Name",
      accessor: (s) => (
        <div>
          <p className="font-semibold text-gray-800">{s.name_bn}</p>
          {s.name_en && <p className="text-xs text-gray-400">{s.name_en}</p>}
        </div>
      ),
    },
    {
      header: isBn ? "ফোন" : "Phone",
      accessor: (s) => s.phone
        ? <span className="text-gray-700">{s.phone}</span>
        : <span className="text-gray-300">—</span>,
    },
    {
      header: isBn ? "ঠিকানা" : "Address",
      accessor: (s) => s.address
        ? <span className="text-gray-600 text-xs">{s.address}</span>
        : <span className="text-gray-300 text-xs">—</span>,
      className: "px-4 py-3 text-sm text-gray-700 max-w-xs",
    },
    {
      header: isBn ? "স্ট্যাটাস" : "Status",
      accessor: (s) => (
        <ToggleSwitch
          checked={s.is_active}
          onChange={() => toggleActive(s)}
          activeLabel={isBn ? "সক্রিয়" : "Active"}
          inactiveLabel={isBn ? "নিষ্ক্রিয়" : "Inactive"}
        />
      ),
    },
  ];

  const quickActions: QuickAction<Supplier>[] = [
    {
      label: isBn ? "সম্পাদনা" : "Edit",
      icon: <Pencil className="w-3.5 h-3.5" />,
      onClick: openEdit,
      className: "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors",
    },
  ];

  return (
    <div className="max-w-7xl">
      <PageHeader
        title={isBn ? "সরবরাহকারী" : "Suppliers"}
        addLabel={isBn ? "+ যোগ করুন" : "+ Add"}
        onAdd={openCreate}
      />

      <ReusableTable<Supplier>
        data={suppliers}
        columns={columns}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        quickActions={quickActions}
        emptyMessage={isBn ? "কোনো সরবরাহকারী নেই" : "No suppliers yet"}
        skeletonRows={6}
        exportFilename="suppliers"
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800">
                {editing ? (isBn ? "সম্পাদনা করুন" : "Edit Supplier") : (isBn ? "নতুন সরবরাহকারী" : "New Supplier")}
              </h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <FloatingInput label={isBn ? "নাম (বাংলা) *" : "Name (Bangla) *"} value={form.name_bn ?? ""} onChange={f("name_bn")} />
            <FloatingInput label={isBn ? "নাম (ইংরেজি)" : "Name (English)"} value={form.name_en ?? ""} onChange={f("name_en")} />
            <FloatingInput label={isBn ? "ফোন" : "Phone"} value={form.phone ?? ""} onChange={f("phone")} />
            <FloatingTextarea label={isBn ? "ঠিকানা" : "Address"} value={form.address ?? ""} onChange={f("address")} rows={2} />
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={creating || updating} className="flex-1 btn-primary">
                {creating || updating ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save")}
              </button>
              <button onClick={close} className="flex-1 btn-secondary">{isBn ? "বাতিল" : "Cancel"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

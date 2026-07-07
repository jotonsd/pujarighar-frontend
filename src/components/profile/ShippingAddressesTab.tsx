"use client";

import {
  useCreateShippingAddressMutation,
  useDeleteShippingAddressMutation,
  useListShippingAddressesQuery,
  useSetDefaultShippingAddressMutation,
  useUpdateShippingAddressMutation,
} from "@/api/shipping/shippingApi";
import { FloatingInput, FloatingTextarea } from "@/components/ui/forms";
import { ShippingAddress } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { CheckCircle, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useState } from "react";

type AddressForm = {
  label: string;
  full_name_bn: string;
  phone: string;
  address_bn: string;
  district: string;
  thana: string;
  post_code: string;
};

const BLANK: AddressForm = {
  label: "",
  full_name_bn: "",
  phone: "",
  address_bn: "",
  district: "",
  thana: "",
  post_code: "",
};

function AddressModal({
  locale,
  editing,
  onClose,
}: {
  locale: string;
  editing: ShippingAddress | null;
  onClose: () => void;
}) {
  const isBn = locale === "bn";
  const [form, setForm] = useState<AddressForm>(
    editing
      ? {
          label: editing.label,
          full_name_bn: editing.full_name_bn,
          phone: editing.phone,
          address_bn: editing.address_bn,
          district: editing.district,
          thana: editing.thana,
          post_code: editing.post_code,
        }
      : BLANK,
  );
  const [create, { isLoading: creating }] = useCreateShippingAddressMutation();
  const [update, { isLoading: updating }] = useUpdateShippingAddressMutation();
  const saving = creating || updating;

  const f = (k: keyof AddressForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await update({ id: editing.id, ...form }).unwrap();
        toast.success(isBn ? "ঠিকানা আপডেট হয়েছে" : "Address updated");
      } else {
        await create(form).unwrap();
        toast.success(isBn ? "ঠিকানা যোগ হয়েছে" : "Address added");
      }
      onClose();
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            {editing ? (isBn ? "ঠিকানা সম্পাদনা" : "Edit Address") : (isBn ? "নতুন ঠিকানা যোগ করুন" : "Add New Address")}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FloatingInput
              label={isBn ? "পূর্ণ নাম *" : "Full Name *"}
              required
              value={form.full_name_bn}
              onChange={f("full_name_bn")}
            />
            <FloatingInput
              label={isBn ? "ফোন *" : "Phone *"}
              required
              value={form.phone}
              onChange={f("phone")}
              placeholder="01XXXXXXXXX"
            />
          </div>
          <FloatingTextarea
            label={isBn ? "ঠিকানা *" : "Address *"}
            required
            value={form.address_bn}
            onChange={f("address_bn")}
            rows={2}
          />
          <div className="grid grid-cols-3 gap-3">
            <FloatingInput label={isBn ? "জেলা" : "District"} value={form.district} onChange={f("district")} />
            <FloatingInput label={isBn ? "থানা" : "Thana"} value={form.thana} onChange={f("thana")} />
            <FloatingInput label={isBn ? "পোস্ট কোড" : "Post Code"} value={form.post_code} onChange={f("post_code")} />
          </div>
          <FloatingInput
            label={isBn ? "লেবেল (যেমন: বাড়ি, অফিস)" : "Label (e.g. Home, Office)"}
            value={form.label}
            onChange={f("label")}
          />
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? (isBn ? "সংরক্ষণ..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save Address")}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              {isBn ? "বাতিল" : "Cancel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ShippingAddressesTab({ locale }: { locale: string }) {
  const isBn = locale === "bn";
  const { data: addresses = [], isLoading } = useListShippingAddressesQuery();
  const [deleteAddress] = useDeleteShippingAddressMutation();
  const [setDefault] = useSetDefaultShippingAddressMutation();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ShippingAddress | null>(null);

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (a: ShippingAddress) => { setEditing(a); setShowModal(true); };

  const handleDelete = async (a: ShippingAddress) => {
    if (!confirm(isBn ? "এই ঠিকানাটি মুছবেন?" : "Delete this address?")) return;
    try {
      await deleteAddress(a.id).unwrap();
      toast.success(isBn ? "মুছে গেছে" : "Deleted");
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed");
    }
  };

  const handleSetDefault = async (a: ShippingAddress) => {
    try {
      await setDefault(a.id).unwrap();
      toast.success(isBn ? "ডিফল্ট ঠিকানা সেট হয়েছে" : "Default address set");
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed");
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {isBn ? "শিপিং ঠিকানা" : "Shipping Addresses"}
        </h2>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors">
          <Plus className="w-3.5 h-3.5" />
          {isBn ? "নতুন ঠিকানা" : "Add Address"}
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-8">{isBn ? "লোড হচ্ছে..." : "Loading..."}</p>
      ) : addresses.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">{isBn ? "কোনো ঠিকানা যোগ করা হয়নি" : "No addresses added yet"}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {addresses.map(a => (
            <div
              key={a.id}
              className={`rounded-xl border p-4 space-y-2 ${a.is_default ? "border-amber-300 bg-amber-50/50" : "border-gray-200"}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                    {a.label || (isBn ? "ঠিকানা" : "Address")}
                    {a.is_default && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        {isBn ? "ডিফল্ট" : "Default"}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.full_name_bn} • {a.phone}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{a.address_bn}</p>
              <p className="text-xs text-gray-400">
                {[a.thana, a.district, a.post_code].filter(Boolean).join(", ") || "—"}
              </p>
              <div className="flex items-center gap-2 pt-1">
                {!a.is_default && (
                  <button
                    onClick={() => handleSetDefault(a)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 hover:text-amber-700"
                  >
                    <CheckCircle className="w-3 h-3" />
                    {isBn ? "ডিফল্ট করুন" : "Set as default"}
                  </button>
                )}
                <button
                  onClick={() => openEdit(a)}
                  className="ml-auto inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(a)}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddressModal locale={locale} editing={editing} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

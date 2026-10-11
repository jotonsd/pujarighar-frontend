"use client";

import {
  PromoPopup,
  useCreatePromoPopupMutation,
  useUpdatePromoPopupMutation,
} from "@/api/promoPopups/promoPopupsApi";
import { FloatingInput } from "@/components/ui/forms";
import FloatingDatePicker from "@/components/ui/forms/FloatingDatePicker";
import { toast } from "@/store/toastStore";
import { useLocale } from "next-intl";
import { useRef, useState } from "react";

const EMPTY_FORM = {
  link: "",
  valid_from: "",
  valid_until: "",
  order: 0,
};

interface Props {
  editItem?: PromoPopup | null;
  onClose: () => void;
}

export default function PromoPopupForm({ editItem, onClose }: Props) {
  const locale = useLocale();
  const isBn = locale === "bn";
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(
    editItem
      ? {
          link: editItem.link,
          valid_from: editItem.valid_from ?? "",
          valid_until: editItem.valid_until ?? "",
          order: editItem.order,
        }
      : { ...EMPTY_FORM },
  );

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editItem?.image ?? null);
  const [clearImage, setClearImage] = useState(false);

  const [createPopup, { isLoading: creating }] = useCreatePromoPopupMutation();
  const [updatePopup, { isLoading: updating }] = useUpdatePromoPopupMutation();
  const saving = creating || updating;

  const f = (key: "link" | "order") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("link", form.link);
    fd.append("order", String(form.order));
    if (form.valid_from) fd.append("valid_from", form.valid_from);
    if (form.valid_until) fd.append("valid_until", form.valid_until);
    if (imageFile) fd.append("image", imageFile);
    if (clearImage && !imageFile) fd.append("clear_image", "1");
    return fd;
  };

  const handleSave = async () => {
    if (!editItem && !imageFile) {
      toast.error(isBn ? "ছবি আবশ্যিক" : "Image is required");
      return;
    }
    try {
      const fd = buildFormData();
      if (editItem) {
        await updatePopup({ id: editItem.id, data: fd }).unwrap();
        toast.success(isBn ? "পপআপ আপডেট হয়েছে" : "Popup updated");
      } else {
        await createPopup(fd).unwrap();
        toast.success(isBn ? "পপআপ তৈরি হয়েছে" : "Popup created");
      }
      onClose();
    } catch {
      toast.error(isBn ? "ব্যর্থ হয়েছে" : "Failed");
    }
  };

  return (
    <div className="card mb-6 space-y-4">
      <h2 className="font-semibold text-muted">
        {editItem ? (isBn ? "পপআপ সম্পাদনা" : "Edit Popup") : (isBn ? "নতুন পপআপ" : "New Popup")}
      </h2>

      {/* Image first, its own row */}
      <div>
        <p className="text-xs text-muted mb-2">{isBn ? "ছবি *" : "Image *"}</p>
        <div className="flex items-center gap-3">
          {imagePreview && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-border" />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                  setClearImage(true);
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-xs px-3 py-1.5">
            {isBn ? "+ ছবি বেছে নিন" : "+ Choose Image"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              setImageFile(file);
              setImagePreview(URL.createObjectURL(file));
            }}
          />
        </div>
      </div>

      {/* Link + Order, one row */}
      <div className="grid grid-cols-3 gap-3">
        <FloatingInput
          label={isBn ? "লিংক (ঐচ্ছিক)" : "Link (optional)"}
          value={form.link}
          onChange={f("link")}
          placeholder="/bn/products?category=..."
        />
        <FloatingInput
          label={isBn ? "ক্রম" : "Order"}
          type="number"
          min="0"
          value={String(form.order)}
          onChange={f("order")}
        />
      </div>

      {/* Valid from/until, one row */}
      <div className="grid grid-cols-2 gap-3">
        <FloatingDatePicker
          label={isBn ? "শুরুর তারিখ (ঐচ্ছিক)" : "Valid from (optional)"}
          value={form.valid_from}
          onChange={v => setForm(p => ({ ...p, valid_from: v }))}
          showTimePicker
          clearable
        />
        <FloatingDatePicker
          label={isBn ? "শেষ তারিখ (ঐচ্ছিক)" : "Valid until (optional)"}
          value={form.valid_until}
          onChange={v => setForm(p => ({ ...p, valid_until: v }))}
          showTimePicker
          clearable
        />
      </div>
      <p className="text-xs text-muted -mt-2">
        {isBn
          ? "খালি রাখলে সক্রিয় থাকা অবস্থায় সবসময় দেখাবে।"
          : "Leave blank to show indefinitely while active."}
      </p>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "..." : editItem ? (isBn ? "সংরক্ষণ করুন" : "Save Changes") : (isBn ? "তৈরি করুন" : "Create")}
        </button>
        <button onClick={onClose} className="btn-secondary">
          {isBn ? "বাতিল" : "Cancel"}
        </button>
      </div>
    </div>
  );
}

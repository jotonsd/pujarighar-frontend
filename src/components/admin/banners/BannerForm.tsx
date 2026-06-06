"use client";

import {
    Banner,
    useCreateBannerMutation,
    useUpdateBannerMutation,
} from "@/api/banners/bannersApi";
import { FloatingInput } from "@/components/ui/forms";
import { toast } from "@/store/toastStore";
import { useLocale } from "next-intl";
import { useRef, useState } from "react";

const BG_PRESETS = [
  "#fef2f2",
  "#fee2e2",
  "#F0FDF4",
  "#EFF6FF",
  "#FDF2F8",
  "#ECFDF5",
  "#FFF1F2",
  "#F5F3FF",
  "#fef2f2",
  "#F0F9FF",
];

const EMPTY_FORM = {
  title_bn: "",
  title_en: "",
  subtitle_bn: "",
  subtitle_en: "",
  badge_text: "",
  bg_color: "#fef2f2",
  link: "",
  order: 0,
};

interface Props {
  editItem?: Banner | null;
  onClose: () => void;
}

export default function BannerForm({ editItem, onClose }: Props) {
  const locale = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(
    editItem
      ? {
          title_bn: editItem.title_bn,
          title_en: editItem.title_en,
          subtitle_bn: editItem.subtitle_bn,
          subtitle_en: editItem.subtitle_en,
          badge_text: editItem.badge_text,
          bg_color: editItem.bg_color,
          link: editItem.link,
          order: editItem.order,
        }
      : { ...EMPTY_FORM },
  );

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    editItem?.image ?? null,
  );
  const [clearImage, setClearImage] = useState(false);

  const [createBanner, { isLoading: creating }] = useCreateBannerMutation();
  const [updateBanner, { isLoading: updating }] = useUpdateBannerMutation();
  const saving = creating || updating;

  const f =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  const buildFormData = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    if (imageFile) fd.append("image", imageFile);
    if (clearImage && !imageFile) fd.append("clear_image", "1");
    return fd;
  };

  const handleSave = async () => {
    if (!form.title_bn || !form.title_en) {
      toast.error(locale === "bn" ? "শিরোনাম আবশ্যিক" : "Title is required");
      return;
    }
    try {
      const fd = buildFormData();
      if (editItem) {
        await updateBanner({ id: editItem.id, data: fd }).unwrap();
        toast.success(
          locale === "bn" ? "ব্যানার আপডেট হয়েছে" : "Banner updated",
        );
      } else {
        await createBanner(fd).unwrap();
        toast.success(
          locale === "bn" ? "ব্যানার তৈরি হয়েছে" : "Banner created",
        );
      }
      onClose();
    } catch {
      toast.error(locale === "bn" ? "ব্যর্থ হয়েছে" : "Failed");
    }
  };

  return (
    <div className="card mb-6 space-y-4">
      <h2 className="font-semibold text-gray-700">
        {editItem
          ? locale === "bn"
            ? "ব্যানার সম্পাদনা"
            : "Edit Banner"
          : locale === "bn"
            ? "নতুন ব্যানার"
            : "New Banner"}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <FloatingInput
          label="শিরোনাম (বাংলা) *"
          value={form.title_bn}
          onChange={f("title_bn")}
        />
        <FloatingInput
          label="Title (English) *"
          value={form.title_en}
          onChange={f("title_en")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FloatingInput
          label="সাব-শিরোনাম (বাংলা)"
          value={form.subtitle_bn}
          onChange={f("subtitle_bn")}
        />
        <FloatingInput
          label="Subtitle (English)"
          value={form.subtitle_en}
          onChange={f("subtitle_en")}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FloatingInput
          label={locale === "bn" ? "ব্যাজ টেক্সট" : "Badge text"}
          value={form.badge_text}
          onChange={f("badge_text")}
        />
        <FloatingInput
          label={locale === "bn" ? "লিংক (ঐচ্ছিক)" : "Link (optional)"}
          value={form.link}
          onChange={f("link")}
          placeholder="/bn/products?category=..."
        />
        <FloatingInput
          label={locale === "bn" ? "ক্রম" : "Order"}
          type="number"
          min="0"
          value={String(form.order)}
          onChange={f("order")}
        />
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">
          {locale === "bn" ? "পটভূমির রঙ" : "Background Color"}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {BG_PRESETS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setForm(p => ({ ...p, bg_color: color }))}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${form.bg_color === color ? "border-amber-500 scale-110" : "border-gray-200"}`}
              style={{ backgroundColor: color }}
            />
          ))}
          <input
            type="color"
            value={form.bg_color}
            onChange={e => setForm(p => ({ ...p, bg_color: e.target.value }))}
            className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer p-0.5"
            title="Custom color"
          />
          <span className="text-xs text-gray-400 font-mono">
            {form.bg_color}
          </span>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">
          {locale === "bn" ? "ছবি (ঐচ্ছিক)" : "Image (optional)"}
        </p>
        <div className="flex items-center gap-3">
          {imagePreview && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-12 object-cover rounded-lg border border-gray-200"
              />
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
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            {locale === "bn" ? "+ ছবি বেছে নিন" : "+ Choose Image"}
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

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving
            ? "..."
            : editItem
              ? locale === "bn"
                ? "সংরক্ষণ করুন"
                : "Save Changes"
              : locale === "bn"
                ? "তৈরি করুন"
                : "Create"}
        </button>
        <button onClick={onClose} className="btn-secondary">
          {locale === "bn" ? "বাতিল" : "Cancel"}
        </button>
      </div>
    </div>
  );
}

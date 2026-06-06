"use client";

import {
    HeroSlide,
    useCreateHeroSlideMutation,
    useUpdateHeroSlideMutation,
} from "@/api/heroSlides/heroSlidesApi";
import { FloatingInput } from "@/components/ui/forms";
import { toast } from "@/store/toastStore";
import { useLocale } from "next-intl";
import { useRef, useState } from "react";

const EMPTY_FORM = {
  title_bn: "",
  title_en: "",
  subtitle_bn: "",
  subtitle_en: "",
  cta_label_bn: "",
  cta_label_en: "",
  cta_link: "",
  bg_color: "#FFF7ED",
  order: 0,
};

interface Props {
  editItem?: HeroSlide | null;
  onClose: () => void;
}

export default function SlideForm({ editItem, onClose }: Props) {
  const locale = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(
    editItem
      ? {
          title_bn: editItem.title_bn,
          title_en: editItem.title_en,
          subtitle_bn: editItem.subtitle_bn,
          subtitle_en: editItem.subtitle_en,
          cta_label_bn: editItem.cta_label_bn,
          cta_label_en: editItem.cta_label_en,
          cta_link: editItem.cta_link,
          bg_color: editItem.bg_color,
          order: editItem.order,
        }
      : { ...EMPTY_FORM },
  );

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    editItem?.image ?? null,
  );

  const [createSlide, { isLoading: creating }] = useCreateHeroSlideMutation();
  const [updateSlide, { isLoading: updating }] = useUpdateHeroSlideMutation();
  const saving = creating || updating;

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  const buildFd = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    if (imageFile) fd.append("image", imageFile);
    return fd;
  };

  const handleSave = async () => {
    if (!form.title_bn && !form.title_en) {
      toast.error(locale === "bn" ? "শিরোনাম দিন" : "Title is required");
      return;
    }
    try {
      const fd = buildFd();
      if (editItem) {
        await updateSlide({ id: editItem.id, data: fd }).unwrap();
        toast.success(
          locale === "bn" ? "স্লাইড আপডেট হয়েছে" : "Slide updated",
        );
      } else {
        await createSlide(fd).unwrap();
        toast.success(locale === "bn" ? "স্লাইড তৈরি হয়েছে" : "Slide created");
      }
      onClose();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="card mb-6 space-y-4">
      <h2 className="font-semibold text-gray-700">
        {editItem
          ? locale === "bn"
            ? "স্লাইড সম্পাদনা"
            : "Edit Slide"
          : locale === "bn"
            ? "নতুন স্লাইড"
            : "New Slide"}
      </h2>

      <div>
        <p className="text-xs text-gray-500 mb-2">
          {locale === "bn" ? "ছবি" : "Image"}
        </p>
        <div className="flex items-center gap-3">
          {imagePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview}
              alt="Preview"
              className="w-32 h-20 object-cover rounded-lg border border-gray-200"
            />
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

      <div className="grid grid-cols-2 gap-3">
        <FloatingInput
          label="শিরোনাম (বাংলা)"
          value={form.title_bn}
          onChange={f("title_bn")}
        />
        <FloatingInput
          label="Title (English)"
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
      <div className="grid grid-cols-2 gap-3">
        <FloatingInput
          label="CTA বাটন (বাংলা)"
          value={form.cta_label_bn}
          onChange={f("cta_label_bn")}
        />
        <FloatingInput
          label="CTA Button (English)"
          value={form.cta_label_en}
          onChange={f("cta_label_en")}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FloatingInput
          label={locale === "bn" ? "লিংক" : "Link"}
          value={form.cta_link}
          onChange={f("cta_link")}
          placeholder="/bn/products"
        />
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={form.bg_color}
            onChange={e => setForm(p => ({ ...p, bg_color: e.target.value }))}
            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
          />
          <span className="text-xs text-gray-400 font-mono">
            {form.bg_color}
          </span>
        </div>
        <FloatingInput
          label={locale === "bn" ? "ক্রম" : "Order"}
          type="number"
          min="0"
          value={String(form.order)}
          onChange={f("order")}
        />
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

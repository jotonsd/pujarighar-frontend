"use client";

import { useCreateBaynaBookingMutation } from "@/api/bayna/baynaApi";
import ServiceTypeSelector from "@/components/bayna/ServiceTypeSelector";
import { FloatingDatePicker, FloatingInput, FloatingTextarea } from "@/components/ui/forms";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "@/store/toastStore";
import { getErrorMessage, getFieldErrors } from "@/utils/apiError";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewBaynaBookingPage() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const router = useRouter();

  const [serviceType, setServiceType] = useState<"PUJARI" | "DHAKI" | "MURTI">("PUJARI");
  const [eventDate, setEventDate] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [createBooking, { isLoading }] = useCreateBaynaBookingMutation();

  const handleCreate = async () => {
    const requiredMsg = isBn ? "এটি আবশ্যক" : "This field is required";
    const errs: Record<string, string> = {};
    if (!eventDate) errs.event_date = requiredMsg;
    if (!name.trim()) errs.name = requiredMsg;
    if (!phone.trim()) errs.phone = requiredMsg;
    if (!location.trim()) errs.location = requiredMsg;
    if (!description.trim()) errs.description = requiredMsg;
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    try {
      await createBooking({
        service_type: serviceType,
        event_date: eventDate,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        location: location.trim(),
        description: description.trim(),
      }).unwrap();
      toast.success(isBn ? "বুকিং তৈরি হয়েছে" : "Booking created");
      router.push(`/${locale}/admin/bayna`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
      setFieldErrors(getFieldErrors(err));
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isBn ? "নতুন বায়না বুকিং" : "New Bayna Booking"}
        description={isBn ? "গ্রাহক ফোনে জানালে ম্যানুয়ালি একটি বুকিং যোগ করুন" : "Manually add a booking a customer called in about"}
        showBack
        backHref={`/${locale}/admin/bayna`}
        backLabel={isBn ? "বায়না তালিকা" : "Bayna Bookings"}
      />

      <div className="card space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {isBn ? "সেবার ধরন" : "Service Type"}
          </p>
          <ServiceTypeSelector value={serviceType} onChange={setServiceType} locale={locale} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FloatingInput
            label={isBn ? "নাম *" : "Name *"}
            value={name}
            onChange={e => setName(e.target.value)}
            error={fieldErrors.name}
          />
          <FloatingInput
            label={isBn ? "ফোন নম্বর *" : "Phone Number *"}
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            error={fieldErrors.phone}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FloatingDatePicker
            label={isBn ? "অনুষ্ঠানের তারিখ *" : "Event Date *"}
            value={eventDate}
            onChange={setEventDate}
            minDate={new Date()}
            error={fieldErrors.event_date}
          />
          <FloatingInput
            label={isBn ? "ইমেইল (ঐচ্ছিক)" : "Email (optional)"}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            error={fieldErrors.email}
          />
        </div>

        <FloatingInput
          label={isBn ? "স্থান *" : "Location *"}
          value={location}
          onChange={e => setLocation(e.target.value)}
          error={fieldErrors.location}
        />

        <FloatingTextarea
          label={isBn ? "বিস্তারিত *" : "Details *"}
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          error={fieldErrors.description}
        />

        <div className="flex gap-3">
          <button onClick={handleCreate} disabled={isLoading} className="btn-primary">
            {isLoading ? (isBn ? "তৈরি হচ্ছে..." : "Creating...") : (isBn ? "তৈরি করুন" : "Create")}
          </button>
          <button onClick={() => router.back()} className="btn-secondary">
            {isBn ? "বাতিল" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

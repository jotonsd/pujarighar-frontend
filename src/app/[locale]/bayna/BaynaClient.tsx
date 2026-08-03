"use client";

import { useGetMeQuery } from "@/api/auth/authApi";
import { useCreateBaynaBookingMutation } from "@/api/bayna/baynaApi";
import ServiceTypeSelector from "@/components/bayna/ServiceTypeSelector";
import { FloatingDatePicker, FloatingInput, FloatingTextarea } from "@/components/ui/forms";
import { BadgeCheck } from "lucide-react";
import { toast } from "@/store/toastStore";
import { getErrorMessage, getFieldErrors } from "@/utils/apiError";
import Cookies from "js-cookie";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

export default function BaynaClient() {
  const locale = useLocale();
  const isBn = locale === "bn";

  // Skips the call entirely when there's no session cookie, matching the
  // pattern in Navbar.tsx — avoids a guaranteed-401 request for guests.
  const { data: me } = useGetMeQuery(undefined, { skip: !Cookies.get("refresh_token") });

  const [serviceType, setServiceType] = useState<"PUJARI" | "DHAKI" | "MURTI">("PUJARI");
  const [eventDate, setEventDate] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.profile?.full_name_bn || me.profile?.full_name_en || "");
      setPhone(me.phone || "");
      setEmail(me.email || "");
    }
  }, [me]);

  const [createBooking, { isLoading }] = useCreateBaynaBookingMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setSubmitted(true);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, locale));
      setFieldErrors(getFieldErrors(err));
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="card text-center py-12 space-y-3">
          <BadgeCheck className="w-12 h-12 mx-auto text-green-600" />
          <h1 className="text-lg font-bold text-gray-800">
            {isBn ? "আপনার অনুরোধ জমা হয়েছে" : "Your request has been submitted"}
          </h1>
          <p className="text-sm text-gray-500">
            {isBn
              ? "আমরা শীঘ্রই আপনার দেওয়া ফোন নম্বরে যোগাযোগ করব।"
              : "We'll contact you soon on the phone number you provided."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <div className="card space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 mb-1">
            {isBn ? "বায়না দিন" : "Request a Booking"}
          </h1>
          <p className="text-sm text-gray-500">
            {isBn
              ? "পূজারী, ঢাকি অথবা মূর্তির জন্য অনুরোধ জানান — আমরা যোগাযোগ করে বিস্তারিত আলোচনা করব।"
              : "Request a Pujari, Dhaki, or custom Murti — we'll reach out to confirm the details."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            label={
              serviceType === "MURTI"
                ? (isBn ? "মূর্তির বিবরণ (আকার, ধরন ইত্যাদি) *" : "Murti details (size, style, etc.) *")
                : (isBn ? "বিস্তারিত (পূজার ধরন, সময়কাল ইত্যাদি) *" : "Details (puja type, duration, etc.) *")
            }
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            error={fieldErrors.description}
          />

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? (isBn ? "জমা হচ্ছে..." : "Submitting...") : (isBn ? "অনুরোধ পাঠান" : "Submit Request")}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";
import { formatAmount } from "@/utils/format";

import {
  useCheckoutMutation,
  useGetCartQuery,
  useRemoveCartItemMutation,
} from "@/api/cart/cartApi";
import { useGuestCheckoutMutation } from "@/api/guest/guestApi";
import {
  useCreateShippingAddressMutation,
  useDeleteShippingAddressMutation,
  useListShippingAddressesQuery,
  useSetDefaultShippingAddressMutation,
} from "@/api/shipping/shippingApi";
import { FloatingInput, FloatingTextarea } from "@/components/ui/forms";
import Spinner from "@/components/ui/Spinner";
import { ShippingAddress } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useGuestCartStore } from "@/store/guestCartStore";
import { toast } from "@/store/toastStore";
import { formatNumber } from "@/utils/format";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PaymentMethod = "COD" | "ONLINE";

type GuestForm = {
  name_bn: string;
  phone: string;
  address_bn: string;
  district: string;
  thana: string;
  post_code: string;
  notes_bn: string;
  email: string;
};

type NewAddressForm = {
  label: string;
  full_name_bn: string;
  phone: string;
  address_bn: string;
  district: string;
  thana: string;
  post_code: string;
};

const BLANK_ADDR: NewAddressForm = {
  label: "",
  full_name_bn: "",
  phone: "",
  address_bn: "",
  district: "",
  thana: "",
  post_code: "",
};

function AddressSelectModal({
  locale,
  addresses,
  selectedId,
  onSelect,
  onCancel,
  onDelete,
  onSetDefault,
  onCreate,
  creating,
}: {
  locale: string;
  addresses: ShippingAddress[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onCreate: (data: NewAddressForm) => Promise<void>;
  creating: boolean;
}) {
  const [localSelected, setLocalSelected] = useState<string | null>(
    selectedId ??
      addresses.find(a => a.is_default)?.id ??
      addresses[0]?.id ??
      null,
  );
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [form, setForm] = useState<NewAddressForm>(BLANK_ADDR);
  const f =
    (k: keyof NewAddressForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreate(form);
      setForm(BLANK_ADDR);
      setShowForm(false);
    } catch {
      /* toast shown by caller */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-800">
          {locale === "bn"
            ? "ডেলিভারি ঠিকানা বেছে নিন"
            : "Select Delivery Address"}
        </h2>

        {/* Saved addresses */}
        {addresses.length > 0 && (
          <div className="space-y-2">
            {addresses.map(addr => (
              <label
                key={addr.id}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  localSelected === addr.id
                    ? "border-amber-400 bg-amber-50"
                    : "border-gray-200 hover:border-amber-200"
                }`}
              >
                <input
                  type="radio"
                  name="addr"
                  className="mt-1 accent-amber-500"
                  checked={localSelected === addr.id}
                  onChange={() => setLocalSelected(addr.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">
                    {addr.full_name_bn}
                    {addr.label ? ` · ${addr.label}` : ""}
                    {addr.is_default && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                        {locale === "bn" ? "ডিফল্ট" : "Default"}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {addr.address_bn}
                  </p>
                  {addr.district && (
                    <p className="text-xs text-gray-400">
                      {addr.district}
                      {addr.thana ? `, ${addr.thana}` : ""}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">{addr.phone}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!addr.is_default && (
                    <button
                      type="button"
                      onClick={() => onSetDefault(addr.id)}
                      className="text-xs text-amber-600 hover:underline"
                    >
                      {locale === "bn" ? "ডিফল্ট করুন" : "Set default"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(addr.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    {locale === "bn" ? "মুছুন" : "Delete"}
                  </button>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Toggle add form */}
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full text-sm text-amber-600 border-2 border-dashed border-amber-200 rounded-xl py-3 hover:bg-amber-50 transition-colors"
          >
            + {locale === "bn" ? "নতুন ঠিকানা যোগ করুন" : "Add New Address"}
          </button>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmitNew}
            className="space-y-3 border border-amber-100 rounded-xl p-4 bg-amber-50/40"
          >
            <p className="text-sm font-semibold text-gray-700">
              {locale === "bn" ? "নতুন ঠিকানা" : "New Address"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FloatingInput
                label={locale === "bn" ? "পূর্ণ নাম *" : "Full Name *"}
                required
                value={form.full_name_bn}
                onChange={f("full_name_bn")}
              />
              <FloatingInput
                label={locale === "bn" ? "ফোন *" : "Phone *"}
                required
                value={form.phone}
                onChange={f("phone")}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <FloatingTextarea
              label={locale === "bn" ? "ঠিকানা *" : "Address *"}
              required
              value={form.address_bn}
              onChange={f("address_bn")}
              rows={2}
            />
            <div className="grid grid-cols-3 gap-3">
              <FloatingInput
                label={locale === "bn" ? "জেলা" : "District"}
                value={form.district}
                onChange={f("district")}
              />
              <FloatingInput
                label={locale === "bn" ? "থানা" : "Thana"}
                value={form.thana}
                onChange={f("thana")}
              />
              <FloatingInput
                label={locale === "bn" ? "পোস্ট কোড" : "Post Code"}
                value={form.post_code}
                onChange={f("post_code")}
              />
            </div>
            <FloatingInput
              label={
                locale === "bn"
                  ? "লেবেল (যেমন: বাড়ি, অফিস)"
                  : "Label (e.g. Home, Office)"
              }
              value={form.label}
              onChange={f("label")}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="btn-primary flex-1 text-sm"
              >
                {creating
                  ? locale === "bn"
                    ? "সংরক্ষণ..."
                    : "Saving..."
                  : locale === "bn"
                    ? "সংরক্ষণ করুন"
                    : "Save Address"}
              </button>
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary text-sm px-4"
                >
                  {locale === "bn" ? "বাতিল" : "Cancel"}
                </button>
              )}
            </div>
          </form>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => localSelected && onSelect(localSelected)}
            disabled={!localSelected}
            className="btn-primary flex-1"
          >
            {locale === "bn" ? "এগিয়ে যান" : "Continue"}
          </button>
          <button onClick={onCancel} className="btn-secondary flex-1">
            {locale === "bn" ? "বাতিল" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodModal({
  locale,
  onSelect,
  onCancel,
}: {
  locale: string;
  onSelect: (method: PaymentMethod) => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">
          {locale === "bn"
            ? "পেমেন্ট পদ্ধতি বেছে নিন"
            : "Choose Payment Method"}
        </h2>

        <button
          onClick={() => onSelect("COD")}
          className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-colors text-left"
        >
          <span className="text-3xl">💵</span>
          <div>
            <p className="font-semibold text-gray-800">
              {locale === "bn" ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery"}
            </p>
            <p className="text-xs text-gray-500">
              {locale === "bn"
                ? "ডেলিভারির সময় পেমেন্ট করুন"
                : "Pay when your order arrives"}
            </p>
          </div>
        </button>

        <button
          onClick={() => onSelect("ONLINE")}
          className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-colors text-left"
        >
          <span className="text-3xl">💳</span>
          <div>
            <p className="font-semibold text-gray-800">
              {locale === "bn" ? "অনলাইন পেমেন্ট" : "Online Payment"}
            </p>
            <p className="text-xs text-gray-500">
              {locale === "bn"
                ? "এখনই পেমেন্ট করুন — অর্ডার স্বয়ংক্রিয়ভাবে নিশ্চিত হবে"
                : "Pay now — order is auto-confirmed instantly"}
            </p>
          </div>
        </button>

        <button
          onClick={onCancel}
          className="w-full text-sm text-gray-400 hover:text-gray-600 pt-1"
        >
          {locale === "bn" ? "বাতিল" : "Cancel"}
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({
  locale,
  lines,
  total,
  paymentMethod,
  onConfirm,
  onCancel,
  loading,
}: {
  locale: string;
  lines: { label: string; qty: number; price: string }[];
  total: string;
  paymentMethod: PaymentMethod;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">
          {locale === "bn" ? "অর্ডার নিশ্চিত করুন" : "Confirm Your Order"}
        </h2>

        <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
          {lines.map((l, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-gray-700 flex-1 truncate pr-2">
                {l.label}
              </span>
              <span className="text-gray-400 text-xs mr-3">
                ×{formatNumber(l.qty, locale)}
              </span>
              <span className="font-semibold text-gray-800">{l.price}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="font-bold text-gray-800">
            {locale === "bn" ? "মোট" : "Total"}
          </span>
          <span className="text-xl font-bold text-amber-600">{total}</span>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 text-sm">
          <span>{paymentMethod === "COD" ? "💵" : "💳"}</span>
          <span className="text-gray-700">
            {paymentMethod === "COD"
              ? locale === "bn"
                ? "ক্যাশ অন ডেলিভারি"
                : "Cash on Delivery"
              : locale === "bn"
                ? "অনলাইন পেমেন্ট"
                : "Online Payment"}
          </span>
        </div>

        {paymentMethod === "COD" && (
          <p className="text-xs text-gray-500">
            {locale === "bn"
              ? "অর্ডারটি অ্যাডমিন কর্তৃক নিশ্চিত করার পর প্রসেস করা হবে।"
              : "Your order will be processed after admin confirmation."}
          </p>
        )}
        {paymentMethod === "ONLINE" && (
          <p className="text-xs text-green-600">
            {locale === "bn"
              ? "পেমেন্ট সফল হলে অর্ডারটি স্বয়ংক্রিয়ভাবে নিশ্চিত হবে।"
              : "Your order will be auto-confirmed upon successful payment."}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading
              ? locale === "bn"
                ? "প্রক্রিয়াকরণ..."
                : "Processing..."
              : locale === "bn"
                ? "হ্যাঁ, অর্ডার দিন"
                : "Yes, Place Order"}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary flex-1"
          >
            {locale === "bn" ? "পিছনে যান" : "Go Back"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const { isAuthenticated } = useAuthStore();
  const setItemCount = useCartStore(s => s.setItemCount);

  const guestItems = useGuestCartStore(s => s.items);
  const guestRemove = useGuestCartStore(s => s.removeItem);
  const guestUpdateQty = useGuestCartStore(s => s.updateQty);
  const guestClear = useGuestCartStore(s => s.clear);
  const guestSubtotal = useGuestCartStore(s => s.subtotal);

  const { data: cart, isLoading } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [removeItem] = useRemoveCartItemMutation();
  const [checkout, { isLoading: checkingOut }] = useCheckoutMutation();
  const [guestCheckout, { isLoading: submitting }] = useGuestCheckoutMutation();

  const { data: addresses = [] } = useListShippingAddressesQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [createAddress, { isLoading: creatingAddress }] =
    useCreateShippingAddressMutation();
  const [deleteAddress] = useDeleteShippingAddressMutation();
  const [setDefaultAddress] = useSetDefaultShippingAddressMutation();

  useEffect(() => {
    if (cart) setItemCount(cart.item_count);
  }, [cart, setItemCount]);

  const [form, setForm] = useState<GuestForm>({
    name_bn: "",
    phone: "",
    address_bn: "",
    district: "",
    thana: "",
    post_code: "",
    notes_bn: "",
    email: "",
  });
  const [orderSuccess, setOrderSuccess] = useState<{
    number: string;
    phone: string;
  } | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  const openCheckoutFlow = () => setShowAddressModal(true);

  const handleAddressSelect = (id: string) => {
    setSelectedAddressId(id);
    setShowAddressModal(false);
    setShowPaymentModal(true);
  };

  const handleCreateAddress = async (data: NewAddressForm) => {
    const newAddr = await createAddress(data).unwrap();
    setSelectedAddressId(newAddr.id);
    toast.success(locale === "bn" ? "ঠিকানা সংরক্ষণ হয়েছে" : "Address saved");
  };

  const handlePaymentSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setShowPaymentModal(false);
    setShowConfirm(true);
  };

  const handleCheckout = async () => {
    try {
      const order = await checkout({
        payment_method: paymentMethod,
        shipping_address_id: selectedAddressId ?? undefined,
      }).unwrap();
      setItemCount(0);
      setShowConfirm(false);
      if (order.gateway_url) {
        window.location.href = order.gateway_url;
        return;
      }
      toast.success(t("cart.orderPlaced"));
      router.push(`/${locale}/orders/${order.id}`);
    } catch {
      toast.error(locale === "bn" ? "চেকআউট ব্যর্থ হয়েছে" : "Checkout failed");
    }
  };

  const handleGuestCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowPaymentModal(true);
  };

  const confirmGuestCheckout = async () => {
    try {
      const result = await guestCheckout({
        items: guestItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity.toFixed(3),
        })),
        ...form,
        payment_method: paymentMethod,
      }).unwrap();
      guestClear();
      setShowConfirm(false);
      if (result.gateway_url) {
        window.location.href = result.gateway_url;
        return;
      }
      setOrderSuccess({ number: result.order_number, phone: form.phone });
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: { message_bn?: string } } }).data
        ?.error?.message_bn;
      toast.error(
        msg ??
          (locale === "bn" ? "অর্ডার দেওয়া যায়নি" : "Could not place order"),
      );
    }
  };

  if (orderSuccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="card space-y-3">
          <p className="text-5xl">✅</p>
          <h2 className="text-xl font-bold text-gray-800">
            {locale === "bn"
              ? "অর্ডার সফলভাবে দেওয়া হয়েছে!"
              : "Order Placed Successfully!"}
          </h2>
          <p className="text-gray-700">
            {locale === "bn" ? "অর্ডার নম্বর:" : "Order Number:"}{" "}
            <strong className="text-amber-600">{orderSuccess.number}</strong>
          </p>
          <p className="text-gray-500 text-sm">
            {locale === "bn"
              ? `আমরা শীঘ্রই ${orderSuccess.phone} নম্বরে যোগাযোগ করব।`
              : `We'll contact you at ${orderSuccess.phone} shortly.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
            <Link
              href={`/${locale}/track?order_number=${encodeURIComponent(orderSuccess.number)}&phone=${encodeURIComponent(orderSuccess.phone)}`}
              className="btn-primary"
            >
              {locale === "bn" ? "অর্ডার ট্র্যাক করুন" : "Track Order"}
            </Link>
            <Link href={`/${locale}/products`} className="btn-secondary">
              {locale === "bn" ? "কেনাকাটা চালিয়ে যান" : "Continue Shopping"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (isLoading) return <Spinner />;
    const items = cart?.items ?? [];
    const confirmLines = items.map(i => ({
      label: locale === "bn" ? i.product_name_bn : i.product_name_en,
      qty: Math.round(Number(i.quantity)),
      price: formatAmount(i.line_total, locale, 0),
    }));

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {t("cart.title")}
        </h1>
        {items.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <p className="text-4xl mb-4">🛒</p>
            <p>{t("cart.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map(item => {
                const name =
                  locale === "bn" ? item.product_name_bn : item.product_name_en;
                const qty = Math.round(Number(item.quantity));
                return (
                  <div key={item.id} className="card space-y-2">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-2xl shrink-0">
                        {item.is_package ? "🎁" : "🪔"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatAmount(item.unit_price, locale, 0)} ×{" "}
                          {formatNumber(qty, locale)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-amber-600">
                          {formatAmount(item.line_total, locale)}
                        </p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-red-400 hover:text-red-600 mt-1"
                        >
                          {t("cart.remove")}
                        </button>
                      </div>
                    </div>
                    {item.is_package && item.package_items?.length > 0 && (
                      <div className="ml-16 pl-3 border-l-2 border-amber-100 space-y-0.5">
                        {item.package_items.map((pi, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs text-gray-500"
                          >
                            <span className="flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                              {locale === "bn"
                                ? pi.component_name_bn
                                : pi.component_name_en}
                            </span>
                            <span className="text-gray-400 ml-2">
                              ×
                              {formatNumber(
                                Math.round(Number(pi.quantity) * qty),
                                locale,
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="card h-fit space-y-4">
              <div className="flex justify-between text-lg font-bold">
                <span>{t("cart.subtotal")}</span>
                <span className="text-amber-600">
                  {formatAmount(cart?.subtotal ?? 0, locale)}
                </span>
              </div>
              <button onClick={openCheckoutFlow} className="btn-primary w-full">
                {t("cart.checkout")}
              </button>
            </div>
          </div>
        )}

        {showAddressModal && (
          <AddressSelectModal
            locale={locale}
            addresses={addresses}
            selectedId={selectedAddressId}
            onSelect={handleAddressSelect}
            onCancel={() => setShowAddressModal(false)}
            onDelete={id => deleteAddress(id)}
            onSetDefault={id => setDefaultAddress(id)}
            onCreate={handleCreateAddress}
            creating={creatingAddress}
          />
        )}
        {showPaymentModal && (
          <PaymentMethodModal
            locale={locale}
            onSelect={handlePaymentSelect}
            onCancel={() => setShowPaymentModal(false)}
          />
        )}
        {showConfirm && (
          <ConfirmModal
            locale={locale}
            lines={confirmLines}
            total={formatAmount(cart?.subtotal ?? 0, locale)}
            paymentMethod={paymentMethod}
            onConfirm={handleCheckout}
            onCancel={() => setShowConfirm(false)}
            loading={checkingOut}
          />
        )}
      </div>
    );
  }

  // Guest cart
  const guestConfirmLines = guestItems.map(i => ({
    label: locale === "bn" ? i.name_bn : i.name_en,
    qty: i.quantity,
    price: formatAmount(parseFloat(i.unit_price) * i.quantity, locale, 0),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        {t("cart.title")}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        <Link
          href={`/${locale}/auth/login`}
          className="text-amber-600 hover:underline"
        >
          {t("nav.login")}
        </Link>{" "}
        {locale === "bn" ? "করুন দ্রুত চেকআউটের জন্য" : "for faster checkout"}
      </p>
      {guestItems.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">🛒</p>
          <p>{t("cart.empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {guestItems.map(item => {
              const name = locale === "bn" ? item.name_bn : item.name_en;
              const total = (
                parseFloat(item.unit_price) * item.quantity
              ).toFixed(2);
              return (
                <div key={item.product_id} className="card space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-xl shrink-0">
                      {item.is_package ? '🎁' : '🪔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{name}</p>
                      <p className="text-xs text-gray-500">{formatAmount(item.unit_price, locale, 0)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <button onClick={() => guestUpdateQty(item.product_id, item.quantity - 1)} className="w-5 h-5 bg-amber-100 rounded text-amber-700 text-xs flex items-center justify-center hover:bg-amber-200">−</button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button onClick={() => guestUpdateQty(item.product_id, Math.min(item.quantity + 1, item.stock))} className="w-5 h-5 bg-amber-100 rounded text-amber-700 text-xs flex items-center justify-center hover:bg-amber-200">+</button>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-amber-600 text-sm">{formatAmount(total, locale)}</p>
                      <button onClick={() => guestRemove(item.product_id)} className="text-xs text-red-400 hover:text-red-600 mt-1">{t("cart.remove")}</button>
                    </div>
                  </div>
                  {item.is_package && item.package_items?.length > 0 && (
                    <div className="ml-14 pl-3 border-l-2 border-amber-100 space-y-0.5">
                      {item.package_items.map((pi, i) => (
                        <div key={i} className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                            {locale === 'bn' ? pi.component_name_bn : pi.component_name_en}
                          </span>
                          <span className="text-gray-400 ml-2">×{formatNumber(Math.round(Number(pi.quantity) * item.quantity), locale)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex justify-between font-bold text-base px-1 pt-1 border-t border-gray-100">
              <span>{t("cart.subtotal")}</span>
              <span className="text-amber-600">
                {formatAmount(guestSubtotal(), locale)}
              </span>
            </div>
          </div>

          <form
            onSubmit={handleGuestCheckout}
            className="lg:col-span-3 card space-y-3"
          >
            <h2 className="font-bold text-gray-800 text-lg">
              {t("cart.guestCheckout")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FloatingInput
                required
                label={`${t("profile.fullNameBn")} *`}
                value={form.name_bn}
                onChange={e =>
                  setForm(f => ({ ...f, name_bn: e.target.value }))
                }
              />
              <FloatingInput
                required
                label={`${t("auth.phone")} *`}
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <FloatingTextarea
              required
              label={`${t("profile.address")} *`}
              value={form.address_bn}
              onChange={e =>
                setForm(f => ({ ...f, address_bn: e.target.value }))
              }
              rows={2}
            />
            <div className="grid grid-cols-3 gap-3">
              <FloatingInput
                label={t("profile.district")}
                value={form.district}
                onChange={e =>
                  setForm(f => ({ ...f, district: e.target.value }))
                }
              />
              <FloatingInput
                label={t("profile.thana")}
                value={form.thana}
                onChange={e => setForm(f => ({ ...f, thana: e.target.value }))}
              />
              <FloatingInput
                label={t("profile.postCode")}
                value={form.post_code}
                onChange={e =>
                  setForm(f => ({ ...f, post_code: e.target.value }))
                }
              />
            </div>
            <FloatingTextarea
              label={t("cart.notes")}
              value={form.notes_bn}
              onChange={e => setForm(f => ({ ...f, notes_bn: e.target.value }))}
              rows={2}
            />
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {t("cart.placeOrder")}
            </button>
          </form>
        </div>
      )}

      {showPaymentModal && (
        <PaymentMethodModal
          locale={locale}
          onSelect={handlePaymentSelect}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
      {showConfirm && (
        <ConfirmModal
          locale={locale}
          lines={guestConfirmLines}
          total={formatAmount(guestSubtotal(), locale)}
          paymentMethod={paymentMethod}
          onConfirm={confirmGuestCheckout}
          onCancel={() => setShowConfirm(false)}
          loading={submitting}
        />
      )}
    </div>
  );
}

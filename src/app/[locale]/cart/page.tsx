"use client";
import { formatAmount } from "@/utils/format";

import {
  useCheckoutMutation,
  useGetCartQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from "@/api/cart/cartApi";
import { useGetDeliveryChargesQuery } from "@/api/deliveryCharges/deliveryChargesApi";
import { useGuestCheckoutMutation } from "@/api/guest/guestApi";
import {
  useCreateShippingAddressMutation,
  useListShippingAddressesQuery,
} from "@/api/shipping/shippingApi";
import OfferBanners from "@/components/products/OfferBanners";
import { FloatingInput, FloatingTextarea } from "@/components/ui/forms";
import Spinner from "@/components/ui/Spinner";
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

function AddAddressModal({
  locale,
  onCreate,
  creating,
  onClose,
}: {
  locale: string;
  onCreate: (data: NewAddressForm) => Promise<void>;
  creating: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<NewAddressForm>(BLANK_ADDR);
  const f =
    (k: keyof NewAddressForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreate(form);
      onClose();
    } catch {
      /* toast shown by caller */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-3">
        <h2 className="text-lg font-bold text-gray-800">
          {locale === "bn" ? "নতুন ঠিকানা যোগ করুন" : "Add New Address"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
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
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={creating}
              className="btn-primary flex-1"
            >
              {creating
                ? locale === "bn"
                  ? "সংরক্ষণ..."
                  : "Saving..."
                : locale === "bn"
                  ? "সংরক্ষণ করুন"
                  : "Save Address"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              {locale === "bn" ? "বাতিল" : "Cancel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RemoveConfirmModal({
  locale,
  productName,
  onConfirm,
  onCancel,
}: {
  locale: string;
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isBn = locale === "bn";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-800">
          {isBn ? "কার্ট থেকে সরাবেন?" : "Remove from cart?"}
        </h2>
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{productName}</span>
          {isBn
            ? " কার্ট থেকে সরিয়ে দেওয়া হবে।"
            : " will be removed from your cart."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {isBn ? "হ্যাঁ, সরান" : "Yes, Remove"}
          </button>
          <button onClick={onCancel} className="flex-1 btn-secondary">
            {isBn ? "বাতিল" : "Cancel"}
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
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-colors text-left"
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
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-colors text-left"
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
  subtotal,
  deliveryCharge,
  deliveryAmount,
  grandTotal,
  paymentMethod,
  onConfirm,
  onCancel,
  loading,
}: {
  locale: string;
  lines: { label: string; qty: number; price: string }[];
  subtotal: string;
  deliveryCharge: string;
  deliveryAmount: number;
  grandTotal: string;
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
              <span className="text-gray-400 text-xs font-bold mr-3">
                ×{formatNumber(l.qty, locale)}
              </span>
              <span className="font-bold text-gray-800">{l.price}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 border-t border-gray-100 pt-2">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{locale === "bn" ? "সাবটোটাল" : "Subtotal"}</span>
            <span className="font-bold">{subtotal}</span>
          </div>
          {deliveryAmount > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {locale === "bn" ? "ডেলিভারি চার্জ" : "Delivery Charge"}
              </span>
              <span className="font-bold">{deliveryCharge}</span>
            </div>
          )}
          <div className="flex items-center justify-between font-bold text-base border-t border-gray-100 pt-1.5">
            <span className="text-gray-800">
              {locale === "bn" ? "সর্বমোট" : "Grand Total"}
            </span>
            <span className="text-amber-600">{grandTotal}</span>
          </div>
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
  const [updateItem] = useUpdateCartItemMutation();
  const [checkout, { isLoading: checkingOut }] = useCheckoutMutation();
  const [guestCheckout, { isLoading: submitting }] = useGuestCheckoutMutation();

  const { data: addresses = [] } = useListShippingAddressesQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [createAddress, { isLoading: creatingAddress }] =
    useCreateShippingAddressMutation();

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
  const [removeTarget, setRemoveTarget] = useState<{
    id: string;
    name: string;
    isGuest: boolean;
  } | null>(null);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [deliveryZone, setDeliveryZone] = useState<"inside" | "outside">(
    "inside",
  );
  const { data: deliveryRates } = useGetDeliveryChargesQuery();

  // Auto-select default address when addresses load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find(a => a.is_default) ?? addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses]);

  const openCheckoutFlow = () => setShowPaymentModal(true);

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
        delivery_zone: deliveryZone,
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
        delivery_zone: deliveryZone,
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
      <div className="max-w-7xl mx-auto px-4 py-3">
        {items.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <p className="text-4xl mb-4">🛒</p>
            <p>{t("cart.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="card divide-y divide-gray-100 p-0 overflow-hidden">
                {items.map(item => {
                  const name =
                    locale === "bn"
                      ? item.product_name_bn
                      : item.product_name_en;
                  const qty = Math.round(Number(item.quantity));
                  return (
                    <div key={item.id} className="px-4 py-3 space-y-2">
                      <div className="flex items-center gap-3">
                        {/* Image */}
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-amber-50 shrink-0 flex items-center justify-center">
                          {item.product_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product_image}
                              alt={name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl">
                              {item.is_package ? "🎁" : "🪔"}
                            </span>
                          )}
                        </div>
                        {/* Name + price */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">
                            {name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatAmount(item.unit_price, locale, 0)}
                          </p>
                        </div>
                        {/* Qty stepper */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() =>
                              qty > 1
                                ? updateItem({
                                    itemId: item.id,
                                    quantity: String(qty - 1),
                                  })
                                : setRemoveTarget({
                                    id: item.id,
                                    name,
                                    isGuest: false,
                                  })
                            }
                            className="w-6 h-6 bg-amber-100 rounded text-amber-700 text-sm flex items-center justify-center hover:bg-amber-200"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold w-7 text-center">
                            {formatNumber(qty, locale)}
                          </span>
                          <button
                            onClick={() =>
                              updateItem({
                                itemId: item.id,
                                quantity: String(qty + 1),
                              })
                            }
                            className="w-6 h-6 bg-amber-100 rounded text-amber-700 text-sm flex items-center justify-center hover:bg-amber-200"
                          >
                            +
                          </button>
                        </div>
                        {/* Total + remove */}
                        <div className="text-right shrink-0 w-20">
                          <p className="font-bold text-amber-600 text-sm">
                            {formatAmount(item.line_total, locale, 0)}
                          </p>
                          <button
                            onClick={() =>
                              setRemoveTarget({
                                id: item.id,
                                name,
                                isGuest: false,
                              })
                            }
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            {t("cart.remove")}
                          </button>
                        </div>
                      </div>
                      {/* Package items */}
                      {item.is_package && item.package_items?.length > 0 && (
                        <div
                          className="ml-15 pl-3 border-l-2 border-amber-100 space-y-0.5"
                          style={{ marginLeft: "60px" }}
                        >
                          {item.package_items.map((pi, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-xs text-gray-400"
                            >
                              <span className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-amber-300 shrink-0" />
                                {locale === "bn"
                                  ? pi.component_name_bn
                                  : pi.component_name_en}
                              </span>
                              <span>
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
            </div>
            <div className="card h-fit space-y-4">
              {/* Delivery address — inline selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700 text-sm">
                    {locale === "bn" ? "ডেলিভারি ঠিকানা" : "Delivery Address"}
                  </h3>
                  <button
                    onClick={() => setShowAddAddressModal(true)}
                    className="text-xs text-amber-600 hover:underline"
                  >
                    + {locale === "bn" ? "নতুন" : "Add New"}
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <button
                    onClick={() => setShowAddAddressModal(true)}
                    className="w-full text-sm text-amber-600 border-2 border-dashed border-amber-200 rounded-xl py-3 hover:bg-amber-50 transition-colors"
                  >
                    + {locale === "bn" ? "ঠিকানা যোগ করুন" : "Add Address"}
                  </button>
                ) : (
                  <div className="space-y-2">
                    {addresses.map(addr => (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                          selectedAddressId === addr.id
                            ? "border-amber-400 bg-amber-50"
                            : "border-gray-100 hover:border-amber-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping_addr"
                          className="mt-0.5 accent-amber-500"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 leading-tight">
                            {addr.full_name_bn}
                            {addr.label && (
                              <span className="text-gray-400 text-xs ml-1">
                                · {addr.label}
                              </span>
                            )}
                            {addr.is_default && (
                              <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 rounded-full">
                                {locale === "bn" ? "ডিফল্ট" : "Default"}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {addr.address_bn}
                          </p>
                          <p className="text-xs text-gray-400">{addr.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery zone + Subtotal + checkout */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                {/* Zone selector */}
                {deliveryRates && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">
                      {locale === "bn" ? "ডেলিভারি এলাকা" : "Delivery Zone"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["inside", "outside"] as const).map(z => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => setDeliveryZone(z)}
                          className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${deliveryZone === z ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600 hover:border-amber-300"}`}
                        >
                          {z === "inside" ? (
                            <>
                              {locale === "bn" ? "ঢাকার ভিতরে" : "Inside Dhaka"}{" "}
                              (
                              <span className="font-bold">
                                ৳
                                {formatNumber(
                                  deliveryRates.inside_dhaka,
                                  locale,
                                )}
                              </span>
                              )
                            </>
                          ) : (
                            <>
                              {locale === "bn"
                                ? "ঢাকার বাইরে"
                                : "Outside Dhaka"}{" "}
                              (
                              <span className="font-bold">
                                ৳
                                {formatNumber(
                                  deliveryRates.outside_dhaka,
                                  locale,
                                )}
                              </span>
                              )
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{t("cart.subtotal")}</span>
                  <span>{formatAmount(cart?.subtotal ?? 0, locale)}</span>
                </div>
                {deliveryRates && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      {locale === "bn" ? "ডেলিভারি চার্জ" : "Delivery Charge"}
                    </span>
                    <span>
                      {formatAmount(
                        deliveryZone === "inside"
                          ? deliveryRates.inside_dhaka
                          : deliveryRates.outside_dhaka,
                        locale,
                        0,
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-100 pt-2">
                  <span>{locale === "bn" ? "সর্বমোট" : "Grand Total"}</span>
                  <span className="text-amber-600">
                    {formatAmount(
                      parseFloat(String(cart?.subtotal ?? 0)) +
                        (deliveryRates
                          ? parseFloat(
                              deliveryZone === "inside"
                                ? deliveryRates.inside_dhaka
                                : deliveryRates.outside_dhaka,
                            )
                          : 0),
                      locale,
                    )}
                  </span>
                </div>
                <button
                  onClick={openCheckoutFlow}
                  disabled={addresses.length > 0 && !selectedAddressId}
                  className="btn-primary w-full"
                >
                  {t("cart.checkout")}
                </button>
              </div>
            </div>
          </div>
        )}

        {removeTarget && !removeTarget.isGuest && (
          <RemoveConfirmModal
            locale={locale}
            productName={removeTarget.name}
            onConfirm={() => {
              removeItem(removeTarget.id);
              setRemoveTarget(null);
            }}
            onCancel={() => setRemoveTarget(null)}
          />
        )}
        {showAddAddressModal && (
          <AddAddressModal
            locale={locale}
            onCreate={handleCreateAddress}
            creating={creatingAddress}
            onClose={() => setShowAddAddressModal(false)}
          />
        )}
        {showPaymentModal && (
          <PaymentMethodModal
            locale={locale}
            onSelect={handlePaymentSelect}
            onCancel={() => setShowPaymentModal(false)}
          />
        )}
        {showConfirm &&
          (() => {
            const sub = parseFloat(String(cart?.subtotal ?? 0));
            const dc = deliveryRates
              ? parseFloat(
                  deliveryZone === "inside"
                    ? deliveryRates.inside_dhaka
                    : deliveryRates.outside_dhaka,
                )
              : 0;
            return (
              <ConfirmModal
                locale={locale}
                lines={confirmLines}
                paymentMethod={paymentMethod}
                subtotal={formatAmount(sub, locale)}
                deliveryCharge={formatAmount(dc, locale, 0)}
                deliveryAmount={dc}
                grandTotal={formatAmount(sub + dc, locale)}
                onConfirm={handleCheckout}
                onCancel={() => setShowConfirm(false)}
                loading={checkingOut}
              />
            );
          })()}
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
    <div className="max-w-7xl mx-auto px-4 py-3">
      <OfferBanners />
      {guestItems.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">🛒</p>
          <p>{t("cart.empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="card divide-y divide-gray-100 p-0 overflow-hidden">
              {guestItems.map(item => {
                const name = locale === "bn" ? item.name_bn : item.name_en;
                const total = (
                  parseFloat(item.unit_price) * item.quantity
                ).toFixed(2);
                return (
                  <div key={item.product_id} className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-amber-50 shrink-0 flex items-center justify-center">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">
                            {item.is_package ? "🎁" : "🪔"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">
                          {name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatAmount(item.unit_price, locale, 0)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() =>
                            item.quantity > 1
                              ? guestUpdateQty(
                                  item.product_id,
                                  item.quantity - 1,
                                )
                              : setRemoveTarget({
                                  id: item.product_id,
                                  name,
                                  isGuest: true,
                                })
                          }
                          className="w-6 h-6 bg-amber-100 rounded text-amber-700 text-sm flex items-center justify-center hover:bg-amber-200"
                        >
                          −
                        </button>
                        <span className="text-sm font-bold w-7 text-center">
                          {formatNumber(item.quantity, locale)}
                        </span>
                        <button
                          onClick={() =>
                            guestUpdateQty(
                              item.product_id,
                              Math.min(item.quantity + 1, item.stock),
                            )
                          }
                          className="w-6 h-6 bg-amber-100 rounded text-amber-700 text-sm flex items-center justify-center hover:bg-amber-200"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right shrink-0 w-20">
                        <p className="font-bold text-amber-600 text-sm">
                          {formatAmount(total, locale, 0)}
                        </p>
                        <button
                          onClick={() =>
                            setRemoveTarget({
                              id: item.product_id,
                              name,
                              isGuest: true,
                            })
                          }
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          {t("cart.remove")}
                        </button>
                      </div>
                    </div>
                    {item.is_package && item.package_items?.length > 0 && (
                      <div
                        className="pl-3 border-l-2 border-amber-100 space-y-0.5"
                        style={{ marginLeft: "60px" }}
                      >
                        {item.package_items.map((pi, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs text-gray-400"
                          >
                            <span className="flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-amber-300 shrink-0" />
                              {locale === "bn"
                                ? pi.component_name_bn
                                : pi.component_name_en}
                            </span>
                            <span>
                              ×
                              {formatNumber(
                                Math.round(Number(pi.quantity) * item.quantity),
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
            <p className="text-base text-gray-500 mt-3">
              <Link
                href={`/${locale}/auth/login`}
                className="text-amber-600 hover:underline font-medium"
              >
                {t("nav.login")}
              </Link>{" "}
              {locale === "bn"
                ? "করুন দ্রুত চেকআউটের জন্য"
                : "for faster checkout"}
            </p>
          </div>

          <form onSubmit={handleGuestCheckout} className="card space-y-3">
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
            {/* Delivery zone selector */}
            {deliveryRates && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">
                  {locale === "bn" ? "ডেলিভারি এলাকা" : "Delivery Zone"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["inside", "outside"] as const).map(z => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setDeliveryZone(z)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${deliveryZone === z ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600 hover:border-amber-300"}`}
                    >
                      {z === "inside" ? (
                        <>
                          {locale === "bn" ? "ঢাকার ভিতরে" : "Inside Dhaka"} (
                          <span className="font-bold">
                            ৳{formatNumber(deliveryRates.inside_dhaka, locale)}
                          </span>
                          )
                        </>
                      ) : (
                        <>
                          {locale === "bn" ? "ঢাকার বাইরে" : "Outside Dhaka"} (
                          <span className="font-bold">
                            ৳{formatNumber(deliveryRates.outside_dhaka, locale)}
                          </span>
                          )
                        </>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-sm font-semibold text-gray-700">
                  <span>{locale === "bn" ? "সর্বমোট" : "Grand Total"}</span>
                  <span className="text-amber-600 font-bold">
                    {formatAmount(
                      guestSubtotal() +
                        parseFloat(
                          deliveryZone === "inside"
                            ? deliveryRates.inside_dhaka
                            : deliveryRates.outside_dhaka,
                        ),
                      locale,
                      0,
                    )}
                  </span>
                </div>
              </div>
            )}
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

      {removeTarget?.isGuest && (
        <RemoveConfirmModal
          locale={locale}
          productName={removeTarget.name}
          onConfirm={() => {
            guestRemove(removeTarget.id);
            setRemoveTarget(null);
          }}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
      {showPaymentModal && (
        <PaymentMethodModal
          locale={locale}
          onSelect={handlePaymentSelect}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
      {showConfirm &&
        (() => {
          const sub = guestSubtotal();
          const dc = deliveryRates
            ? parseFloat(
                deliveryZone === "inside"
                  ? deliveryRates.inside_dhaka
                  : deliveryRates.outside_dhaka,
              )
            : 0;
          return (
            <ConfirmModal
              locale={locale}
              lines={guestConfirmLines}
              paymentMethod={paymentMethod}
              subtotal={formatAmount(sub, locale)}
              deliveryCharge={formatAmount(dc, locale, 0)}
              deliveryAmount={dc}
              grandTotal={formatAmount(sub + dc, locale)}
              onConfirm={confirmGuestCheckout}
              onCancel={() => setShowConfirm(false)}
              loading={submitting}
            />
          );
        })()}
    </div>
  );
}

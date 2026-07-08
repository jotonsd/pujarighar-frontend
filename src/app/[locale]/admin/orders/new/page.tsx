"use client";

import { useLookupUserByPhoneQuery } from "@/api/auth/authApi";
import { useGetBrandsQuery } from "@/api/brands/brandsApi";
import { useGetCategoriesQuery } from "@/api/categories/categoriesApi";
import { useGetDeliveryChargesQuery } from "@/api/deliveryCharges/deliveryChargesApi";
import { usePosCreateOrderMutation } from "@/api/orders/ordersApi";
import { useGetProductsQuery } from "@/api/products/productsApi";
import { useAdminGetUserAddressesQuery, useAdminCreateUserAddressMutation, useAdminUpdateUserAddressMutation } from "@/api/users/usersApi";
import {
  Checkbox,
  FloatingInput,
  FloatingSelect,
  FloatingTextarea,
} from "@/components/ui/forms";
import { POSProductSkeleton } from "@/components/ui/skeletons";
import { Product, ShippingAddress } from "@/lib/types";
import { toast } from "@/store/toastStore";
import { formatAmount, formatNumber } from "@/utils/format";
import { CheckCircle2, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function POSProductCard({
  product,
  inCart,
  inStock,
  locale,
  onClick,
}: {
  product: Product;
  inCart: { quantity: number } | undefined;
  inStock: boolean;
  locale: string;
  onClick: () => void;
}) {
  const images = product.images ?? [];
  const hasMany = images.length > 1;
  const [imgIdx, setImgIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!hasMany) return;
    timerRef.current = setInterval(
      () => setImgIdx(i => (i + 1) % images.length),
      3000,
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasMany, images.length]);

  const name = locale === "bn" ? product.name_bn : product.name_en;
  const imgSrc = images[imgIdx]?.image;

  return (
    <button
      onClick={onClick}
      disabled={!inStock}
      className={`text-left rounded-xl border transition-all p-2 ${
        inCart
          ? "border-amber-400 bg-amber-50 ring-1 ring-amber-400"
          : inStock
            ? "border-gray-200 bg-white hover:border-amber-300 hover:shadow-sm"
            : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
      }`}
    >
      <div className="aspect-square bg-amber-50 rounded-lg overflow-hidden mb-2 relative">
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgSrc} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            {product.is_package ? "🎁" : "🪔"}
          </div>
        )}
        {hasMany && (
          <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-1 h-1 rounded-full transition-colors ${i === imgIdx ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight">
        {name}
      </p>
      {(product.brand_name_bn || product.brand_name_en) && (
        <p className="text-[10px] text-amber-500 font-medium truncate mt-0.5">
          {locale === "bn" ? (product.brand_name_bn || product.brand_name_en) : (product.brand_name_en || product.brand_name_bn)}
        </p>
      )}
      {product.active_discount_type && parseFloat(String(product.effective_price)) < parseFloat(String(product.unit_price)) ? (
        <div className="mt-0.5 flex items-baseline gap-1">
          <p className="text-sm font-bold text-amber-600">
            {formatAmount(product.effective_price, locale, 0)}
          </p>
          <p className="text-[10px] text-gray-400 line-through">
            {formatAmount(product.unit_price, locale, 0)}
          </p>
        </div>
      ) : (
        <p className="text-sm font-bold text-amber-600 mt-0.5">
          {formatAmount(product.effective_price ?? product.unit_price, locale, 0)}
        </p>
      )}
      {inCart && (
        <p className="text-xs text-amber-600 font-bold mt-0.5">
          {locale === "bn"
            ? `কার্টে: ${formatNumber(inCart.quantity, locale)}`
            : `In cart: ${formatNumber(inCart.quantity, locale)}`}
        </p>
      )}
      {!inStock && (
        <p className="text-xs text-amber-400 mt-0.5">
          {locale === "bn" ? "স্টক নেই" : "Out of stock"}
        </p>
      )}
    </button>
  );
}

interface CartLine {
  product: Product;
  quantity: number;
}

type Tab = "products" | "packages";

export default function POSPage() {
  const locale = useLocale();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("products");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");

  const { data: productsData, isLoading } = useGetProductsQuery({
    search,
    category: catFilter || undefined,
    brand: brandFilter || undefined,
    is_package: tab === "packages" ? "true" : "false",
    page_size: 25,
  });
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brands = [] } = useGetBrandsQuery();

  const products = productsData?.data ?? [];

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartLine[]>([]);

  const addToCart = (product: Product) => {
    const isPackage = product.is_package;
    if (!isPackage && Number(product.stock_on_hand) <= 0) return;
    setCart(c => {
      const existing = c.find(l => l.product.id === product.id);
      if (existing) {
        const max = isPackage ? 999 : Number(product.stock_on_hand);
        return c.map(l =>
          l.product.id === product.id
            ? { ...l, quantity: Math.min(l.quantity + 1, max) }
            : l,
        );
      }
      return [...c, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(c =>
      c.map(l => (l.product.id === productId ? { ...l, quantity: qty } : l)),
    );
  };

  const removeFromCart = (productId: string) =>
    setCart(c => c.filter(l => l.product.id !== productId));

  const subtotal = cart.reduce(
    (s, l) => s + parseFloat(l.product.effective_price) * l.quantity,
    0,
  );

  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("FLAT");
  const [discountValue, setDiscountValue] = useState("0");
  const discountAmount = (() => {
    const val = parseFloat(discountValue);
    if (!val || val <= 0) return 0;
    const raw = discountType === "PERCENTAGE" ? (subtotal * val) / 100 : val;
    return Math.min(Math.max(raw, 0), subtotal);
  })();
  const netSubtotal = subtotal - discountAmount;

  const [applyDelivery, setApplyDelivery] = useState(true);
  const [deliveryZone, setDeliveryZone] = useState<"inside" | "outside">(
    "inside",
  );
  const { data: deliveryRates } = useGetDeliveryChargesQuery();

  // ── Customer form ─────────────────────────────────────────────────────────
  const [customer, setCustomer] = useState({
    name_bn: "",
    phone: "",
    address_bn: "",
    district: "",
    thana: "",
    post_code: "",
    notes_bn: "",
  });

  const [phoneQuery, setPhoneQuery]           = useState("");
  const [selectedUserId, setSelectedUserId]   = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddrForm, setShowNewAddrForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: "", address_bn: "", district: "", thana: "", post_code: "" });
  const [savingAddr, setSavingAddr]           = useState(false);

  const { data: foundUser } = useLookupUserByPhoneQuery(phoneQuery, { skip: phoneQuery.length < 11 });
  const { data: userAddresses = [] } = useAdminGetUserAddressesQuery(selectedUserId ?? "", { skip: !selectedUserId });
  const [createUserAddress] = useAdminCreateUserAddressMutation();
  const [updateUserAddress] = useAdminUpdateUserAddressMutation();

  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editAddr, setEditAddr] = useState({ label: "", address_bn: "", district: "", thana: "", post_code: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const startEdit = (addr: ShippingAddress) => {
    setEditingAddressId(addr.id);
    setEditAddr({ label: addr.label || "", address_bn: addr.address_bn || addr.address_en || "", district: addr.district || "", thana: addr.thana || "", post_code: addr.post_code || "" });
    setShowNewAddrForm(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedUserId || !editingAddressId) return;
    setSavingEdit(true);
    try {
      const updated = await updateUserAddress({
        userId: selectedUserId,
        addressId: editingAddressId,
        data: { label: editAddr.label, address_bn: editAddr.address_bn, district: editAddr.district, thana: editAddr.thana, post_code: editAddr.post_code },
      }).unwrap();
      if (selectedAddressId === editingAddressId) applyAddress(updated);
      setEditingAddressId(null);
      toast.success(locale === "bn" ? "ঠিকানা আপডেট হয়েছে" : "Address updated");
    } catch {
      toast.error(locale === "bn" ? "আপডেট ব্যর্থ হয়েছে" : "Failed to update");
    } finally {
      setSavingEdit(false);
    }
  };

  const deliveryCharge = (() => {
    if (!applyDelivery || !deliveryRates) return 0;
    return parseFloat(
      deliveryZone === "inside"
        ? deliveryRates.inside_dhaka
        : deliveryRates.outside_dhaka,
    );
  })();

  const grandTotal = netSubtotal + deliveryCharge;

  const applyAddress = (addr: ShippingAddress) => {
    setCustomer(c => ({
      ...c,
      name_bn:    addr.full_name_bn || addr.full_name_en || c.name_bn,
      address_bn: addr.address_bn   || addr.address_en  || "",
      district:   addr.district     || "",
      thana:      addr.thana        || "",
      post_code:  addr.post_code    || "",
    }));
    setSelectedAddressId(addr.id);
    setShowNewAddrForm(false);
  };

  const handleSaveNewAddress = async () => {
    if (!selectedUserId || !newAddr.address_bn) return;
    setSavingAddr(true);
    try {
      const saved = await createUserAddress({
        userId: selectedUserId,
        data: {
          label:      newAddr.label || (locale === "bn" ? "নতুন ঠিকানা" : "New Address"),
          full_name_bn: customer.name_bn,
          phone:      customer.phone,
          address_bn: newAddr.address_bn,
          district:   newAddr.district,
          thana:      newAddr.thana,
          post_code:  newAddr.post_code,
        },
      }).unwrap();
      applyAddress(saved);
      setNewAddr({ label: "", address_bn: "", district: "", thana: "", post_code: "" });
      toast.success(locale === "bn" ? "ঠিকানা সংরক্ষিত হয়েছে" : "Address saved");
    } catch {
      toast.error(locale === "bn" ? "ব্যর্থ হয়েছে" : "Failed to save address");
    } finally {
      setSavingAddr(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const [posCreate, { isLoading: submitting }] = usePosCreateOrderMutation();

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error(locale === "bn" ? "কার্ট খালি" : "Cart is empty");
      return;
    }
    if (!customer.name_bn || !customer.phone) {
      toast.error(
        locale === "bn" ? "নাম ও ফোন নম্বর দিন" : "Name and phone are required",
      );
      return;
    }
    try {
      const order = await posCreate({
        items: cart.map(l => ({
          product_id: l.product.id,
          quantity: l.quantity.toFixed(3),
        })),
        ...customer,
        ...(selectedUserId ? { customer_id: selectedUserId } : {}),
        apply_delivery: applyDelivery,
        delivery_zone: applyDelivery ? deliveryZone : undefined,
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
      }).unwrap();
      toast.success(
        locale === "bn"
          ? `অর্ডার তৈরি হয়েছে: ${order.order_number}`
          : `Order created: ${order.order_number}`,
      );
      router.push(`/${locale}/admin/orders/${order.id}`);
    } catch (err: unknown) {
      const msg = (
        err as {
          data?: { error?: { message_bn?: string; message_en?: string } };
        }
      ).data?.error;
      toast.error(
        locale === "bn"
          ? (msg?.message_bn ?? "ব্যর্থ হয়েছে")
          : (msg?.message_en ?? "Failed"),
      );
    }
  };

  return (
    <div className="flex flex-col lg:h-[calc(100vh-8rem)] lg:flex-row gap-3 lg:overflow-hidden">
      {/* ── Left: Product browser ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:overflow-hidden">
        {/* Tab + Search */}
        <div className="shrink-0 pt-2 space-y-2">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {(["products", "packages"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setSearch("");
                  setCatFilter("");
                  setBrandFilter("");
                }}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  tab === t
                    ? "bg-white shadow text-amber-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "products"
                  ? locale === "bn"
                    ? "পণ্য"
                    : "Products"
                  : locale === "bn"
                    ? "প্যাকেজ"
                    : "Packages"}
              </button>
            ))}
          </div>

          {/* Search + Category */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <FloatingInput
                label={locale === "bn" ? "খুঁজুন" : "Search"}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {tab === "products" && (
              <div className="flex gap-2">
                <div className="flex-1 sm:w-40">
                  <FloatingSelect
                    label={locale === "bn" ? "কেটাগরি" : "Category"}
                    value={catFilter}
                    onChange={val => setCatFilter(val)}
                  >
                    <option value="">
                      {locale === "bn" ? "সব কেটাগরি" : "All categories"}
                    </option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {locale === "bn" ? c.name_bn : c.name_en}
                      </option>
                    ))}
                  </FloatingSelect>
                </div>
                <div className="flex-1 sm:w-36">
                  <FloatingSelect
                    label={locale === "bn" ? "ব্র্যান্ড" : "Brand"}
                    value={brandFilter}
                    onChange={val => setBrandFilter(val)}
                  >
                    <option value="">
                      {locale === "bn" ? "সব ব্র্যান্ড" : "All brands"}
                    </option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>
                        {locale === "bn" ? b.name_bn : b.name_en}
                      </option>
                    ))}
                  </FloatingSelect>
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <POSProductSkeleton count={25} />
        ) : (
          <div className="lg:overflow-y-auto lg:flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start mt-3">
            {products.map(product => (
              <POSProductCard
                key={product.id}
                product={product}
                inCart={cart.find(l => l.product.id === product.id)}
                inStock={
                  product.is_package || Number(product.stock_on_hand) > 0
                }
                locale={locale}
                onClick={() => addToCart(product)}
              />
            ))}
            {products.length === 0 && !isLoading && (
              <p className="col-span-full text-center text-gray-400 py-12">
                {locale === "bn"
                  ? "কোনো পণ্য পাওয়া যায়নি"
                  : "No products found"}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Right: Order panel ── */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-3 lg:overflow-y-auto">
        <div className="card lg:flex-1 lg:min-h-0 flex flex-col">
          <h2 className="font-semibold text-gray-800 mb-3 shrink-0">
            {locale === "bn" ? "অর্ডার আইটেম" : "Order Items"}
            {cart.length > 0 && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                {cart.length}
              </span>
            )}
          </h2>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6 flex-1 flex items-center justify-center">
              {locale === "bn"
                ? "পণ্য নির্বাচন করুন"
                : "Click a product to add"}
            </p>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-80 lg:max-h-none lg:flex-1">
              {cart.map(line => (
                <div
                  key={line.product.id}
                  className={`rounded-lg ${line.product.is_package ? "bg-amber-50 border border-amber-100 p-2" : "py-1"}`}
                >
                  {/* Main line */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {line.product.is_package && (
                          <span className="mr-1">🎁</span>
                        )}
                        {locale === "bn"
                          ? line.product.name_bn
                          : line.product.name_en}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatAmount(line.product.effective_price, locale, 0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() =>
                          updateQty(line.product.id, line.quantity - 1)
                        }
                        className="w-5 h-5 bg-gray-100 rounded text-xs font-bold flex items-center justify-center hover:bg-amber-100"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-xs font-bold">
                        {formatNumber(line.quantity, locale)}
                      </span>
                      <button
                        onClick={() =>
                          updateQty(
                            line.product.id,
                            Math.min(
                              line.quantity + 1,
                              line.product.is_package
                                ? 999
                                : Number(line.product.stock_on_hand),
                            ),
                          )
                        }
                        className="w-5 h-5 bg-gray-100 rounded text-xs font-bold flex items-center justify-center hover:bg-amber-100"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs font-bold text-amber-600 w-14 text-right shrink-0">
                      {formatAmount(
                        parseFloat(line.product.effective_price) * line.quantity,
                        locale,
                        0,
                      )}
                    </p>
                    <button
                      onClick={() => removeFromCart(line.product.id)}
                      className="w-5 h-5 flex items-center justify-center rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Package items sub-list */}
                  {line.product.is_package &&
                    line.product.package_items?.length > 0 && (
                      <div className="mt-1.5 pl-2 border-l-2 border-amber-200 space-y-0.5">
                        {line.product.package_items.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs text-gray-500"
                          >
                            <span className="flex items-center gap-1 truncate">
                              <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                              {locale === "bn"
                                ? item.component_name_bn
                                : item.component_name_en}
                            </span>
                            <span className="shrink-0 ml-1 text-gray-400">
                              ×{Number(item.quantity) * line.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="border-t border-gray-100 pt-2 mt-2 shrink-0 space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{locale === "bn" ? "সাবটোটাল" : "Subtotal"}</span>
                <span>{formatAmount(subtotal, locale, 0)}</span>
              </div>

              {/* Discount */}
              <div className="flex items-center gap-1.5 py-0.5">
                <span className="text-xs text-gray-500 shrink-0">{locale === "bn" ? "ছাড়:" : "Discount:"}</span>
                <div className="flex gap-0.5 bg-gray-100 rounded-md p-0.5 shrink-0">
                  {([
                    { key: "PERCENTAGE", label: "%" },
                    { key: "FLAT", label: "৳" },
                  ] as const).map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setDiscountType(opt.key)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                        discountType === opt.key ? "bg-white shadow text-amber-700" : "text-gray-500"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1 min-w-0">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400 pointer-events-none">
                    {discountType === "PERCENTAGE" ? "%" : "৳"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={discountType === "PERCENTAGE" ? 100 : undefined}
                    value={discountValue}
                    onChange={e => setDiscountValue(e.target.value)}
                    className="w-full pl-5 pr-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-300"
                  />
                </div>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-red-500">
                  <span>{locale === "bn" ? "ছাড়" : "Discount"}</span>
                  <span>−{formatAmount(discountAmount, locale, 0)}</span>
                </div>
              )}

              {applyDelivery && deliveryCharge > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{locale === "bn" ? "ডেলিভারি" : "Delivery"}</span>
                  <span>{formatAmount(deliveryCharge, locale, 0)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-100">
                <span>{locale === "bn" ? "সর্বমোট" : "Grand Total"}</span>
                <span className="text-amber-600">
                  {formatAmount(grandTotal, locale, 0)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm">
            {locale === "bn" ? "গ্রাহকের তথ্য" : "Customer Details"}
          </h2>

          {/* Phone lookup */}
          <div>
            <FloatingInput
              label={locale === "bn" ? "ফোন *" : "Phone *"}
              value={customer.phone}
              onChange={e => {
                const v = e.target.value;
                setCustomer(c => ({ ...c, phone: v }));
                setPhoneQuery(v.length >= 11 ? v : "");
                if (v.length < 11) { setSelectedUserId(null); setSelectedAddressId(null); }
              }}
              placeholder="01XXXXXXXXX"
            />
            {foundUser && customer.phone.length >= 11 && (
              <div className="mt-1.5 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-green-800 truncate flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {foundUser.profile?.full_name_bn || foundUser.profile?.full_name_en || foundUser.email}
                  </p>
                  <p className="text-[10px] text-green-600">{foundUser.email}</p>
                </div>
                {selectedUserId !== foundUser.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserId(foundUser.id);
                      setCustomer(c => ({
                        ...c,
                        name_bn: foundUser.profile?.full_name_bn || foundUser.profile?.full_name_en || "",
                      }));
                      setSelectedAddressId(null);
                      setShowNewAddrForm(false);
                    }}
                    className="text-[10px] bg-green-600 text-white px-2 py-1 rounded-lg ml-2 shrink-0 hover:bg-green-700"
                  >
                    {locale === "bn" ? "নির্বাচন করুন" : "Select"}
                  </button>
                )}
                {selectedUserId === foundUser.id && (
                  <span className="text-[10px] text-green-700 ml-2 shrink-0 font-semibold">
                    {locale === "bn" ? "✓ নির্বাচিত" : "✓ Selected"}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Name — only for guest orders */}
          {!selectedUserId && (
            <FloatingInput
              label={locale === "bn" ? "নাম (বাংলা) *" : "Name *"}
              value={customer.name_bn}
              onChange={e => setCustomer(c => ({ ...c, name_bn: e.target.value }))}
            />
          )}

          {/* Address section */}
          {selectedUserId ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {locale === "bn" ? "ডেলিভারি ঠিকানা" : "Delivery Address"}
              </p>

              {/* Saved addresses */}
              {userAddresses.length > 0 && (
                <div className="space-y-1.5">
                  {userAddresses.map(addr => (
                    <div key={addr.id}>
                      {editingAddressId === addr.id ? (
                        /* ── Inline edit form ── */
                        <div className="border border-amber-300 rounded-lg p-3 space-y-2 bg-amber-50">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-amber-700">{locale === "bn" ? "ঠিকানা সম্পাদনা" : "Edit Address"}</p>
                            <button type="button" onClick={() => setEditingAddressId(null)} className="text-gray-400 hover:text-gray-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <FloatingInput
                            label={locale === "bn" ? "লেবেল" : "Label"}
                            value={editAddr.label}
                            onChange={e => setEditAddr(a => ({ ...a, label: e.target.value }))}
                          />
                          <FloatingTextarea
                            label={locale === "bn" ? "ঠিকানা *" : "Address *"}
                            value={editAddr.address_bn}
                            onChange={e => setEditAddr(a => ({ ...a, address_bn: e.target.value }))}
                            rows={2}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <FloatingInput label={locale === "bn" ? "জেলা" : "District"} value={editAddr.district} onChange={e => setEditAddr(a => ({ ...a, district: e.target.value }))} />
                            <FloatingInput label={locale === "bn" ? "থানা" : "Thana"} value={editAddr.thana} onChange={e => setEditAddr(a => ({ ...a, thana: e.target.value }))} />
                          </div>
                          <FloatingInput label={locale === "bn" ? "পোস্ট কোড" : "Post Code"} value={editAddr.post_code} onChange={e => setEditAddr(a => ({ ...a, post_code: e.target.value }))} />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              disabled={savingEdit || !editAddr.address_bn}
                              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                            >
                              {savingEdit ? (locale === "bn" ? "সংরক্ষণ..." : "Saving...") : (locale === "bn" ? "আপডেট করুন" : "Update")}
                            </button>
                            <button type="button" onClick={() => setEditingAddressId(null)} className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50">
                              {locale === "bn" ? "বাতিল" : "Cancel"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Address card ── */
                        <div
                          className={`rounded-lg border px-3 py-2 transition-colors text-xs ${
                            selectedAddressId === addr.id ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <button type="button" onClick={() => applyAddress(addr)} className="flex-1 text-left min-w-0">
                              {addr.label && <p className="font-semibold text-gray-700 truncate">{addr.label}</p>}
                              <p className="text-gray-600 truncate">{addr.address_bn || addr.address_en}</p>
                              {addr.district && <p className="text-gray-400">{addr.district}{addr.thana ? `, ${addr.thana}` : ""}</p>}
                            </button>
                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                              {addr.is_default && selectedAddressId !== addr.id && (
                                <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{locale === "bn" ? "ডিফল্ট" : "Default"}</span>
                              )}
                              {selectedAddressId === addr.id && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                              <button
                                type="button"
                                onClick={() => startEdit(addr)}
                                className="text-gray-400 hover:text-amber-600 transition-colors p-0.5"
                                title={locale === "bn" ? "সম্পাদনা" : "Edit"}
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add new address toggle */}
              {!showNewAddrForm ? (
                <button
                  type="button"
                  onClick={() => { setShowNewAddrForm(true); setSelectedAddressId(null); }}
                  className="w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded-lg py-2 text-xs text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {locale === "bn" ? "নতুন ঠিকানা যোগ করুন" : "Add new address"}
                </button>
              ) : (
                <div className="border border-amber-200 rounded-lg p-3 space-y-2 bg-amber-50">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-amber-700">{locale === "bn" ? "নতুন ঠিকানা" : "New Address"}</p>
                    <button type="button" onClick={() => setShowNewAddrForm(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <FloatingInput
                    label={locale === "bn" ? "লেবেল (যেমন: বাড়ি, অফিস)" : "Label (e.g. Home, Office)"}
                    value={newAddr.label}
                    onChange={e => setNewAddr(a => ({ ...a, label: e.target.value }))}
                  />
                  <FloatingTextarea
                    label={locale === "bn" ? "ঠিকানা *" : "Address *"}
                    value={newAddr.address_bn}
                    onChange={e => setNewAddr(a => ({ ...a, address_bn: e.target.value }))}
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <FloatingInput
                      label={locale === "bn" ? "জেলা" : "District"}
                      value={newAddr.district}
                      onChange={e => setNewAddr(a => ({ ...a, district: e.target.value }))}
                    />
                    <FloatingInput
                      label={locale === "bn" ? "থানা" : "Thana"}
                      value={newAddr.thana}
                      onChange={e => setNewAddr(a => ({ ...a, thana: e.target.value }))}
                    />
                  </div>
                  <FloatingInput
                    label={locale === "bn" ? "পোস্ট কোড" : "Post Code"}
                    value={newAddr.post_code}
                    onChange={e => setNewAddr(a => ({ ...a, post_code: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={handleSaveNewAddress}
                    disabled={savingAddr || !newAddr.address_bn}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                  >
                    {savingAddr
                      ? (locale === "bn" ? "সংরক্ষণ..." : "Saving...")
                      : (locale === "bn" ? "সংরক্ষণ করুন ও নির্বাচন করুন" : "Save & Select")}
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* Guest / no user selected — manual address entry */
            <>
              <FloatingTextarea
                label={locale === "bn" ? "ঠিকানা" : "Address"}
                value={customer.address_bn}
                onChange={e => setCustomer(c => ({ ...c, address_bn: e.target.value }))}
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <FloatingInput label={locale === "bn" ? "জেলা" : "District"} value={customer.district} onChange={e => setCustomer(c => ({ ...c, district: e.target.value }))} />
                <FloatingInput label={locale === "bn" ? "থানা" : "Thana"} value={customer.thana} onChange={e => setCustomer(c => ({ ...c, thana: e.target.value }))} />
              </div>
            </>
          )}

          <FloatingInput
            label={locale === "bn" ? "মন্তব্য" : "Notes"}
            value={customer.notes_bn}
            onChange={e => setCustomer(c => ({ ...c, notes_bn: e.target.value }))}
          />
          <Checkbox
            checked={applyDelivery}
            onChange={() => setApplyDelivery(p => !p)}
            label={
              locale === "bn"
                ? "ডেলিভারি চার্জ যোগ করুন"
                : "Apply delivery charge"
            }
          />
          {applyDelivery && deliveryRates && (
            <div className="grid grid-cols-2 gap-2">
              {(["inside", "outside"] as const).map(z => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setDeliveryZone(z)}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    deliveryZone === z
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-gray-200 text-gray-600 hover:border-amber-300"
                  }`}
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
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || cart.length === 0}
          className="btn-primary w-full py-3 text-base font-bold sticky bottom-2 lg:static shadow-lg lg:shadow-none z-10"
        >
          {submitting
            ? locale === "bn"
              ? "তৈরি হচ্ছে..."
              : "Creating..."
            : locale === "bn"
              ? `অর্ডার তৈরি করুন • ${formatAmount(grandTotal, locale, 0)}`
              : `Create Order • ${formatAmount(grandTotal, locale, 0)}`}
        </button>
      </div>
    </div>
  );
}

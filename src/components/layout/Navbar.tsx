"use client";

import { useGetMeQuery, useLogoutMutation } from "@/api/auth/authApi";
import { useGetCategoriesQuery } from "@/api/categories/categoriesApi";
import { useGetSiteSettingsQuery } from "@/api/settings/settingsApi";
import CartPreview from "@/components/layout/CartPreview";
import NotificationBell from "@/components/ui/NotificationBell";
import { NavGroupChild, NavGroupItem, NavItem, NavSubGroupItem, User } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { formatAmount } from "@/utils/format";
import Cookies from "js-cookie";
import {
  Settings, Cog, Package, LogOut, Copy, Check, ScrollText,
  Receipt, ShoppingBag, LayoutDashboard, BarChart3, TrendingUp, TrendingDown,
  Boxes, Gift, Tag, BadgeCheck, Percent, Warehouse, ClipboardList, Truck,
  Users as UsersIcon, Handshake, PiggyBank, Landmark, BookOpen, NotebookPen, PlusCircle,
  Scale, ShoppingCart, FileBarChart, Undo2, CreditCard, Megaphone,
  GalleryHorizontal, Target, Mail, Star, Home, Store, FileText, Shield, ListTree, Search, ChevronRight, Calendar,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

// Fallback menu for unauthenticated (guest) users — not fetched from API
const GUEST_MENU: NavItem[] = [
  { type: "link", href: "/",         icon: "home",         label_bn: "হোম",           label_en: "Home" },
  { type: "link", href: "/products", icon: "store",        label_bn: "পণ্য",           label_en: "Products" },
  { type: "link", href: "/packages", icon: "gift",         label_bn: "প্যাকেজ",        label_en: "Packages" },
  { type: "link", href: "/bayna",    icon: "calendar",     label_bn: "বায়না",          label_en: "Bayna" },
  { type: "link", href: "/blog",     icon: "file-text",    label_bn: "ব্লগ",           label_en: "Blog" },
  { type: "link", href: "/track",    icon: "truck",        label_bn: "অর্ডার ট্র্যাক", label_en: "Track Order" },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function label(item: { label_bn: string; label_en: string }, locale: string) {
  return locale === "bn" ? item.label_bn : item.label_en;
}

function isSubGroup(item: NavGroupChild): item is NavSubGroupItem {
  return (item as NavSubGroupItem).type === "group";
}

// Menu icons come from the backend as name keys (see _build_nav_menu) rather than
// emoji, so they render consistently across platforms/fonts.
const NAV_ICONS: Record<string, LucideIcon> = {
  receipt: Receipt,
  "shopping-bag": ShoppingBag,
  "layout-dashboard": LayoutDashboard,
  "bar-chart": BarChart3,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  boxes: Boxes,
  package: Package,
  gift: Gift,
  tag: Tag,
  "badge-check": BadgeCheck,
  percent: Percent,
  warehouse: Warehouse,
  "clipboard-list": ClipboardList,
  truck: Truck,
  users: UsersIcon,
  handshake: Handshake,
  "piggy-bank": PiggyBank,
  landmark: Landmark,
  "plus-circle": PlusCircle,
  settings: Settings,
  "book-open": BookOpen,
  "notebook-pen": NotebookPen,
  scale: Scale,
  "shopping-cart": ShoppingCart,
  "file-bar-chart": FileBarChart,
  undo: Undo2,
  "credit-card": CreditCard,
  megaphone: Megaphone,
  "gallery-horizontal": GalleryHorizontal,
  target: Target,
  mail: Mail,
  star: Star,
  home: Home,
  store: Store,
  "file-text": FileText,
  shield: Shield,
  "list-tree": ListTree,
  "chevron-right": ChevronRight,
  calendar: Calendar,
};

function NavIcon({ name, className = "w-4 h-4" }: { name: string; className?: string }) {
  const Icon = NAV_ICONS[name];
  return Icon ? <Icon className={className} /> : null;
}

// ── NavDropdown ───────────────────────────────────────────────────────────────

const PANEL_WIDTH = 208; // px, matches w-52
const CLOSE_DELAY = 150; // ms — small grace period so the pointer can cross into the panel/flyout

function NavDropdown({
  locale,
  pathname,
  group,
  forceActive = false,
}: {
  locale: string;
  pathname: string;
  group: NavGroupItem;
  forceActive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [subOpen, setSubOpen] = useState<{ index: number; top: number; left: number } | null>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = forceActive || group.items.some(i =>
    isSubGroup(i)
      ? i.items.some(l => pathname.startsWith(`/${locale}${l.href}`))
      : pathname.startsWith(`/${locale}${i.href}`),
  );

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setSubOpen(null);
    }, CLOSE_DELAY);
  };

  const handleEnter = () => {
    clearCloseTimer();
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen(true);
  };

  const handleSubEnter = (i: number, e: React.MouseEvent<HTMLDivElement>) => {
    clearCloseTimer();
    const r = e.currentTarget.getBoundingClientRect();
    setSubOpen({ index: i, top: r.top, left: pos.left + PANEL_WIDTH + 4 });
  };

  const closeAll = () => {
    setOpen(false);
    setSubOpen(null);
  };

  const activeSubGroup =
    subOpen && isSubGroup(group.items[subOpen.index]) ? (group.items[subOpen.index] as NavSubGroupItem) : null;

  return (
    <div onMouseEnter={handleEnter} onMouseLeave={scheduleClose}>
      <button
        ref={btnRef}
        onClick={() => (open ? closeAll() : handleEnter())}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
          isActive
            ? "bg-amber-50 text-amber-700"
            : "text-gray-600 hover:text-amber-700 hover:bg-gray-50"
        }`}
      >
        <NavIcon name={group.icon} />
        <span>{label(group, locale)}</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          className="fixed bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 max-h-[70vh] overflow-y-auto"
          style={{ top: pos.top, left: pos.left, width: PANEL_WIDTH }}
        >
          {group.items.map((item, i) => {
            if (isSubGroup(item)) {
              const subActive = item.items.some(l => pathname.startsWith(`/${locale}${l.href}`));
              const active = subOpen?.index === i;
              return (
                <div key={i} onMouseEnter={e => handleSubEnter(i, e)}>
                  <div
                    className={`flex items-center justify-between gap-2 px-4 py-2.5 text-xs cursor-default transition-colors ${
                      active || subActive
                        ? "bg-amber-50 text-amber-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-amber-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <NavIcon name={item.icon} />
                      {label(item, locale)}
                    </span>
                    <svg className="w-3 h-3 -rotate-90" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              );
            }
            const full = `/${locale}${item.href}`;
            const active = pathname.startsWith(full);
            return (
              <Link
                key={item.href}
                href={full}
                onClick={closeAll}
                onMouseEnter={() => setSubOpen(null)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs transition-colors ${
                  active
                    ? "bg-amber-50 text-amber-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-amber-700"
                }`}
              >
                <NavIcon name={item.icon} />
                {label(item, locale)}
              </Link>
            );
          })}
        </div>
      )}
      {activeSubGroup && (
        <div
          className="fixed w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
          style={{ top: subOpen!.top, left: subOpen!.left }}
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
        >
          {activeSubGroup.items.map(sub => {
            const full = `/${locale}${sub.href}`;
            const active = pathname.startsWith(full);
            return (
              <Link
                key={sub.href}
                href={full}
                onClick={closeAll}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs transition-colors ${
                  active
                    ? "bg-amber-50 text-amber-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-amber-700"
                }`}
              >
                <NavIcon name={sub.icon} />
                {label(sub, locale)}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ProfileDropdown ───────────────────────────────────────────────────────────

function ProfileDropdown({
  locale,
  user,
  onLogout,
  t,
}: {
  locale: string;
  user: User;
  onLogout: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const initials = (user.profile?.full_name_en || user.email || "?")
    .charAt(0)
    .toUpperCase();
  const balance = parseFloat(user.profile?.cashback_balance ?? "0");
  const isBn = locale === "bn";

  return (
    <div className="relative flex items-center gap-1.5">
      {/* Cashback balance chip — always visible for customers */}
      {user.role.code === "CUSTOMER" && (
        <span className="flex items-center gap-1 px-2 h-8 bg-amber-50 border border-amber-200 rounded-md text-xs font-bold text-amber-700 whitespace-nowrap">
          {formatAmount(balance, locale, 0)}
        </span>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-amber-700 transition-colors"
      >
        <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm overflow-hidden shrink-0">
          {user.profile?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profile.avatar} alt={initials} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : initials}
        </span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
            <div className="px-4 py-2.5 border-b border-gray-50">
              <p className="text-xs font-medium text-gray-800 truncate">
                {user.profile?.full_name_bn || user.profile?.full_name_en || "—"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
              <p className="text-xs text-amber-500 font-medium mt-0.5">{isBn ? user.role.name_bn : user.role.name_en}</p>
              {user.role.code === "CUSTOMER" && (
                <>
                  <div className="mt-1.5 flex items-center gap-1.5 bg-amber-50 rounded-lg px-2 py-1.5">
                    <div>
                      <p className="text-[10px] text-amber-700 leading-none">
                        {isBn ? "ক্যাশব্যাক ব্যালেন্স" : "Cashback Balance"}
                      </p>
                      <p className="text-xs font-bold text-amber-700 leading-tight mt-0.5">
                        {formatAmount(balance, locale, 0)}
                      </p>
                    </div>
                  </div>
                  {user.referral_code && (
                    <div className="mt-1.5 bg-gray-50 rounded-lg px-2 py-1.5">
                      <p className="text-[10px] text-gray-400 leading-none mb-1">
                        {isBn ? "রেফারেল কোড" : "Referral Code"}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(user.referral_code);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="flex items-center gap-1.5 w-full"
                        title={isBn ? "কপি করুন" : "Copy"}
                      >
                        <span className="text-xs font-mono font-bold text-gray-700 tracking-widest">{user.referral_code}</span>
                        <span className="text-[10px] ml-auto flex items-center gap-1">
                          {copied
                            ? <span className="text-green-500 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> {isBn ? "কপি হয়েছে!" : "Copied!"}</span>
                            : <Copy className="w-3 h-3 text-gray-400" />
                          }
                        </span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <Link
              href={`/${locale}/profile`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
            >
              <Cog className="w-4 h-4" /> {isBn ? "সেটিং" : "Settings"}
            </Link>

            {user.role.code === "ADMIN" && (
              <Link
                href={`/${locale}/admin/logs`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
              >
                <ScrollText className="w-4 h-4" /> {isBn ? "লগ ভিউয়ার" : "Log Viewer"}
              </Link>
            )}

            {user.role.code === "CUSTOMER" && (
              <Link
                href={`/${locale}/orders`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
              >
                <Package className="w-4 h-4" /> {t("nav.orders")}
              </Link>
            )}

            <hr className="my-1 border-gray-100" />

            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> {t("nav.logout")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── MobileMenu ────────────────────────────────────────────────────────────────

function MobileMenu({
  locale,
  pathname,
  menu,
  currentUser,
  t,
  onClose,
  onLogout,
  onSearch,
}: {
  locale: string;
  pathname: string;
  menu: NavItem[];
  currentUser: User | null;
  t: ReturnType<typeof useTranslations>;
  onClose: () => void;
  onLogout: () => void;
  onSearch: (q: string) => void;
}) {
  const [q, setQ] = useState("");
  const [expandedSubKey, setExpandedSubKey] = useState<string | null>(null);
  const role = currentUser?.role.code ?? null;
  const hideSearch = pathname.includes("/admin") || (!!currentUser && role !== "CUSTOMER");
  const { data: siteSettings } = useGetSiteSettingsQuery();
  const logoSrc = siteSettings?.logo || "/assets/logo/pujarighar.png";
  const companyName = locale === "bn"
    ? (siteSettings?.company_name_bn || "পূজারিঘর")
    : (siteSettings?.company_name_en || "PujariGhar");

  const newOrderPath = `/${locale}/admin/orders/new`;
  const navLink = (href: string, icon: string, lbl: string, indent = false) => {
    const full = href === "/" ? `/${locale}` : `/${locale}${href}`;
    const active =
      pathname === full ||
      (pathname.startsWith(full + "/") &&
        full !== `/${locale}` &&
        pathname !== newOrderPath);
    return (
      <Link
        key={href}
        href={full}
        onClick={onClose}
        className={`flex items-center gap-3 ${indent ? "pl-8 pr-4" : "px-4"} py-3 text-sm transition-colors ${
          active
            ? "bg-amber-50 text-amber-700 font-medium"
            : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <NavIcon name={icon} className="w-[18px] h-[18px]" />
        {lbl}
      </Link>
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(q.trim());
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <Image src={logoSrc} alt={companyName} width={75} height={32} className="h-8 w-auto object-contain" />
          <button
            onClick={onClose}
            aria-label={locale === "bn" ? "বন্ধ করুন" : "Close menu"}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search — only for guest/customer */}
        {!hideSearch && (
          <form onSubmit={handleSearch} className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={t("common.search")}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-gray-50"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          </form>
        )}

        {/* Nav links — driven by menu */}
        <div className="flex-1 overflow-y-auto py-2">
          {menu.map((item, i) => {
            if (item.type === "link") {
              return navLink(item.href, item.icon, label(item, locale));
            }
            // group
            const grp = item as NavGroupItem;

            // The Category dropdown is a synthetic, potentially-long flat
            // list of live category data — rendered as its own collapsible
            // row (same look as a regular link, chevron, collapsed by
            // default) instead of the "always-expanded list under a header"
            // treatment used for the backend-driven admin nav groups below.
            if (grp.id === "category-menu") {
              const key = `top-${i}`;
              const expanded = expandedSubKey === key;
              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => setExpandedSubKey(expanded ? null : key)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <NavIcon name={grp.icon} className="w-[18px] h-[18px]" />
                      {label(grp, locale)}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {expanded && (
                    <div className="bg-gray-50/60">
                      {grp.items.map(leaf =>
                        isSubGroup(leaf) ? null : navLink(leaf.href, leaf.icon, label(leaf, locale), true),
                      )}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={i} className="border-t border-gray-100 mt-2 pt-2">
                <p className="px-4 py-1 text-xs text-gray-400 font-medium uppercase tracking-wide">
                  {label(grp, locale)}
                </p>
                {grp.items.map((sub, j) => {
                  if (isSubGroup(sub)) {
                    const key = `${i}-${j}`;
                    const expanded = expandedSubKey === key;
                    return (
                      <div key={key}>
                        <button
                          type="button"
                          onClick={() => setExpandedSubKey(expanded ? null : key)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <span className="flex items-center gap-3">
                            <NavIcon name={sub.icon} className="w-[18px] h-[18px]" />
                            {label(sub, locale)}
                          </span>
                          <svg
                            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                          </svg>
                        </button>
                        {expanded && (
                          <div className="bg-gray-50/60">
                            {sub.items.map(leaf =>
                              navLink(leaf.href, leaf.icon, label(leaf, locale), true),
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return navLink(sub.href, sub.icon, label(sub, locale));
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4">
          {currentUser ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm overflow-hidden shrink-0">
                  {currentUser.profile?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentUser.profile.avatar} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    (currentUser.profile?.full_name_bn || currentUser.email || "U")[0].toUpperCase()
                  )}
                </span>
                <p className="text-xs text-gray-700 font-medium truncate">
                  {currentUser.profile?.full_name_bn || currentUser.email}
                </p>
              </div>
              {currentUser.role.code === "CUSTOMER" && (
                <div className="flex items-center gap-1.5 bg-amber-50 rounded-lg px-2.5 py-1.5">
                  <div>
                    <p className="text-[10px] text-amber-700">{locale === "bn" ? "ক্যাশব্যাক" : "Cashback Balance"}</p>
                    <p className="text-xs font-bold text-amber-700">{formatAmount(currentUser.profile?.cashback_balance ?? "0", locale, 0)}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Link
                  href={`/${locale}/profile`}
                  onClick={onClose}
                  className="flex-1 btn-secondary text-xs text-center py-1.5"
                >
                  {locale === "bn" ? "সেটিং" : "Settings"}
                </Link>
                <button
                  onClick={() => { onClose(); onLogout(); }}
                  className="flex-1 text-xs text-red-500 border border-red-200 rounded-lg py-1.5 hover:bg-red-50"
                >
                  {t("nav.logout")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href={`/${locale}/auth/login`} onClick={onClose} className="flex-1 btn-secondary text-xs text-center py-1.5">
                {t("nav.login")}
              </Link>
              <Link href={`/${locale}/auth/register`} onClick={onClose} className="flex-1 btn-primary text-xs text-center py-1.5">
                {t("nav.register")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── SearchParamSync ───────────────────────────────────────────────────────────
// Isolated so only this sliver needs a Suspense boundary (useSearchParams()
// requires one) instead of the whole Navbar — wrapping the entire Navbar made
// it stream in as a separate, later chunk behind the rest of the page.
function SearchParamSync({ onChange }: { onChange: (q: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onChange(searchParams.get("search") ?? "");
  }, [searchParams, onChange]);
  return null;
}

// ── Navbar ────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = pathname.includes("/admin");
  const [mobileOpen, setMobileOpen] = useState(false);

  const { logout, updateUser, hydrated } = useAuthStore();
  const [logoutMutation] = useLogoutMutation();

  // Not gated on the store's `isAuthenticated` flag — that's derived from a
  // client-side cookie read on mount and can be stale/wrong after a refresh
  // (e.g. right after the store's own hydrate() effect hasn't run yet, or
  // read a momentarily-inconsistent cookie). This call is the actual source
  // of truth: it goes through the normal access/refresh flow regardless, so
  // a genuinely valid session is always detected.
  //
  // It IS skipped when there's no `refresh_token` cookie at all — unlike the
  // `isAuthenticated` flag, a cookie read is synchronous and always current
  // as of this render (setAuth()/logout() write/clear it before updating the
  // store, and this component re-renders on every store change), so this
  // can't go stale the way the old flag-based skip did. This just avoids
  // sending a call that's guaranteed to 401 for the majority of storefront
  // traffic (guests with no session), without reintroducing the staleness
  // bugs — anyone who actually has a session cookie still gets the real,
  // server-validated check every time.
  const { data: me, error: meError } = useGetMeQuery(undefined, {
    skip: !Cookies.get("refresh_token"),
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (meError && "status" in meError && meError.status === 401) logout();
  }, [meError, logout]);

  useEffect(() => {
    if (me) updateUser(me);
  }, [me]);

  const currentUser = me ?? null;
  const role = currentUser?.role.code ?? null;

  const { data: siteSettings } = useGetSiteSettingsQuery();
  const logoSrc = siteSettings?.logo || "/assets/logo/pujarighar.png";
  const companyName = locale === "bn"
    ? (siteSettings?.company_name_bn || "পূজারিঘর")
    : (siteSettings?.company_name_en || "PujariGhar");

  // Active menu: backend-driven for authenticated users, guest fallback otherwise
  const baseMenu: NavItem[] = currentUser?.nav_menu ?? GUEST_MENU;

  // "Category" dropdown — only guest/customer menus have a plain '/products'
  // link (staff nav uses '/admin/products'), so splicing it in right after
  // that link naturally scopes this to guest/customer only, with no extra
  // role check needed. Categories are per-tenant data, not static like the
  // rest of the menu, so this is built here rather than baked into
  // GUEST_MENU or the backend's hardcoded CUSTOMER menu.
  const { data: navCategories = [] } = useGetCategoriesQuery();
  const categoriesGroup: NavGroupItem | null = navCategories.length > 0 ? {
    type: "group",
    id: "category-menu",
    icon: "tag",
    label_bn: "ক্যাটাগরি",
    label_en: "Category",
    items: navCategories.map(c => ({
      href: `/products?category=${c.slug}`,
      icon: "chevron-right",
      label_bn: c.name_bn,
      label_en: c.name_en,
    })),
  } : null;
  const menu: NavItem[] = categoriesGroup
    ? baseMenu.flatMap(item =>
        item.type === "link" && item.href === "/products" ? [item, categoriesGroup] : [item],
      )
    : baseMenu;

  const showCart = !currentUser || role === "CUSTOMER";

  // Search
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Input stays mounted (needed so the width transition has something to
    // animate to/from) — focus it manually on open instead of `autoFocus`,
    // which only fires once on initial mount.
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(`/${locale}/products${q ? `?search=${encodeURIComponent(q)}` : ""}`);
  };

  const handleLogout = async () => {
    try {
      const Cookies = (await import("js-cookie")).default;
      await logoutMutation({ refresh: Cookies.get("refresh_token") ?? "" }).unwrap();
    } catch {}
    // logout() itself resets the RTK Query cache (see authStore.ts) so the
    // Navbar doesn't keep rendering the previous user's stale data.
    logout();
    router.push(`/${locale}`);
  };

  const handleMobileSearch = (q: string) => {
    router.push(`/${locale}/products${q ? `?search=${encodeURIComponent(q)}` : ""}`);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-[1010]">
      <Suspense fallback={null}>
        <SearchParamSync onChange={setQuery} />
      </Suspense>
      {mobileOpen && (
        <MobileMenu
          locale={locale}
          pathname={pathname}
          menu={menu}
          currentUser={currentUser}
          t={t}
          onClose={() => setMobileOpen(false)}
          onLogout={handleLogout}
          onSearch={handleMobileSearch}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-16">
          {/* Hamburger */}
          {role !== "DELIVERY" && (
            <button
              className="md:hidden text-gray-600 hover:text-amber-700 p-1 -ml-1"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Logo */}
          <Link
            href={
              role === "DELIVERY"
                ? `/${locale}/delivery/orders`
                : !!currentUser && role !== "CUSTOMER"
                  ? `/${locale}/admin/orders/new`
                  : `/${locale}`
            }
            className="flex-1 md:flex-none shrink-0"
          >
            <Image src={logoSrc} alt={companyName} width={94} height={40} priority className="h-10 w-auto object-contain" />
          </Link>

          {/* Desktop: all menu items in order — links and group dropdowns together */}
          <div className="hidden md:flex items-center overflow-x-auto scrollbar-hide flex-1 gap-1 min-w-0">
            {menu.map((item, i) => {
              // Staff-type users (not customer, not guest) can land on admin pages
              // that don't literally match a specific nav item (e.g. an order
              // detail page) — rather than showing nothing highlighted, default to
              // the first menu item. Scoped to the admin section only, so this
              // never fires while a staff user is simply browsing the public site
              // (e.g. the homepage), which would otherwise show "POS" as active
              // while a completely different page is on screen.
              const isStaffUser = !!currentUser && role !== "CUSTOMER" && pathname.startsWith(`/${locale}/admin`);
              const anyActive = menu.some(m =>
                m.type === "group"
                  ? m.items.some(sub =>
                      isSubGroup(sub)
                        ? sub.items.some(l => pathname.startsWith(`/${locale}${l.href}`))
                        : pathname.startsWith(`/${locale}${sub.href}`),
                    )
                  : pathname.startsWith(`/${locale}${m.href}`),
              );
              const forceFirstActive = i === 0 && isStaffUser && !anyActive;

              if (item.type === "group") {
                return (
                  <NavDropdown key={i} locale={locale} pathname={pathname} group={item} forceActive={forceFirstActive} />
                );
              }
              const full = item.href === "/" ? `/${locale}` : `/${locale}${item.href}`;
              const newOrderPath = `/${locale}/admin/orders/new`;
              const active =
                forceFirstActive ||
                pathname === full ||
                (pathname.startsWith(full + "/") &&
                  full !== `/${locale}` &&
                  pathname !== newOrderPath);
              return (
                <Link
                  key={item.href}
                  href={full}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? "bg-amber-50 text-amber-700"
                      : "text-gray-600 hover:text-amber-700 hover:bg-gray-50"
                  }`}
                >
                  <NavIcon name={item.icon} />
                  {locale === "bn" ? item.label_bn : item.label_en}
                </Link>
              );
            })}
          </div>

          {/* Search — only for guest/customer. Collapsed to an icon button by
              default (expands on click) so it doesn't eat a fixed 256-320px
              of row width and squeeze out later menu items (e.g. "Track
              Order" was getting clipped in the longer English label). */}
          <div
            ref={searchRef}
            className={`relative shrink-0 items-center h-9 ${
              isAdmin || (!!currentUser && role !== "CUSTOMER")
                ? "hidden"
                : "hidden md:flex"
            }`}
          >
            {!searchOpen && (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label={t("common.search")}
                className="p-2 text-gray-700 hover:text-amber-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <Search className="w-5 h-5" strokeWidth={2.5} />
              </button>
            )}
            {/* Anchored to the right edge (same spot as the icon button),
                sliding in from the right and fading in — a right-to-left
                reveal, not a dropdown from below. Animates only `transform`
                and `opacity` (not `width`) so it's GPU-composited instead of
                triggering layout on every frame. */}
            <div
              className={`absolute right-0 top-1/2 w-64 lg:w-80 z-50 transition-[transform,opacity] duration-300 ease-out ${
                searchOpen
                  ? "-translate-y-1/2 translate-x-0 opacity-100"
                  : "-translate-y-1/2 translate-x-4 opacity-0 pointer-events-none"
              }`}
            >
              <form
                onSubmit={e => { handleSearch(e); setSearchOpen(false); }}
                className="w-full"
              >
                <div className="relative w-full">
                  <input
                    ref={searchInputRef}
                    type="text"
                    tabIndex={searchOpen ? 0 : -1}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={t("common.search")}
                    className="w-full pl-9 pr-9 py-1.5 text-sm border-2 border-gray-200 rounded-lg shadow-lg focus:outline-none focus:border-amber-400 bg-white"
                  />
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <button
                    type="button"
                    tabIndex={searchOpen ? 0 : -1}
                    onClick={() => setSearchOpen(false)}
                    aria-label={locale === "bn" ? "বন্ধ করুন" : "Close"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 shrink-0">
            {role === "ADMIN" && (
              <Link
                href={`/${locale}/admin/settings`}
                className="text-gray-500 hover:text-amber-700 transition-colors"
                title={locale === "bn" ? "সেটিং" : "Settings"}
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}
            <LanguageSwitcher />
            {currentUser && <NotificationBell isAdmin={role === "ADMIN"} />}

            {showCart && <CartPreview locale={locale} />}

            {currentUser ? (
              <ProfileDropdown locale={locale} user={currentUser} onLogout={handleLogout} t={t} />
            ) : (
              <div className="flex items-center justify-end gap-2 w-[136px] shrink-0">
                {!hydrated ? (
                  <>
                    <div className="shimmer rounded-md w-10 h-4" />
                    <div className="shimmer rounded-lg w-20 h-8" />
                  </>
                ) : (
                  <>
                    <Link href={`/${locale}/auth/login`} className="text-gray-600 hover:text-amber-700 text-sm">
                      {t("nav.login")}
                    </Link>
                    <Link href={`/${locale}/auth/register`} className="btn-primary text-sm">
                      {t("nav.register")}
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

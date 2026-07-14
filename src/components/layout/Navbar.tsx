"use client";

import { useGetMeQuery, useLogoutMutation } from "@/api/auth/authApi";
import { useGetSiteSettingsQuery } from "@/api/settings/settingsApi";
import CartPreview from "@/components/layout/CartPreview";
import NotificationBell from "@/components/ui/NotificationBell";
import { NavGroupItem, NavItem, User } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { formatAmount } from "@/utils/format";
import { Settings, Cog, Package, LogOut, Copy, Check, ScrollText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

// Fallback menu for unauthenticated (guest) users — not fetched from API
const GUEST_MENU: NavItem[] = [
  { type: "link", href: "/",         icon: "🏠", label_bn: "হোম",           label_en: "Home" },
  { type: "link", href: "/products", icon: "🪔", label_bn: "পণ্য",           label_en: "Products" },
  { type: "link", href: "/packages", icon: "🎁", label_bn: "প্যাকেজ",        label_en: "Packages" },
  { type: "link", href: "/track",    icon: "📦", label_bn: "অর্ডার ট্র্যাক", label_en: "Track Order" },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function label(item: { label_bn: string; label_en: string }, locale: string) {
  return locale === "bn" ? item.label_bn : item.label_en;
}

// ── NavDropdown ───────────────────────────────────────────────────────────────

function NavDropdown({
  locale,
  pathname,
  group,
}: {
  locale: string;
  pathname: string;
  group: NavGroupItem;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const isActive = group.items.some(l =>
    pathname.startsWith(`/${locale}${l.href}`),
  );

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen(o => !o);
  };

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
          isActive
            ? "bg-amber-50 text-amber-700 font-medium"
            : "text-gray-600 hover:text-amber-600 hover:bg-gray-50"
        }`}
      >
        <span>{group.icon}</span>
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
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
            style={{ top: pos.top, left: pos.left }}
          >
            {group.items.map(item => {
              const full = `/${locale}${item.href}`;
              const active = pathname.startsWith(full);
              return (
                <Link
                  key={item.href}
                  href={full}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs transition-colors ${
                    active
                      ? "bg-amber-50 text-amber-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-amber-600"
                  }`}
                >
                  <span>{item.icon}</span>
                  {label(item, locale)}
                </Link>
              );
            })}
          </div>
        </>
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
      {user.role === "CUSTOMER" && (
        <span className="flex items-center gap-1 px-2 h-8 bg-amber-50 border border-amber-200 rounded-md text-xs font-bold text-amber-700 whitespace-nowrap">
          {formatAmount(balance, locale, 0)}
        </span>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-amber-600 transition-colors"
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
              <p className="text-xs text-amber-500 font-medium mt-0.5">{user.role}</p>
              {user.role === "CUSTOMER" && (
                <>
                  <div className="mt-1.5 flex items-center gap-1.5 bg-amber-50 rounded-lg px-2 py-1.5">
                    <div>
                      <p className="text-[10px] text-amber-600 leading-none">
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

            {user.role === "ADMIN" && (
              <Link
                href={`/${locale}/admin/logs`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
              >
                <ScrollText className="w-4 h-4" /> {isBn ? "লগ ভিউয়ার" : "Log Viewer"}
              </Link>
            )}

            {user.role === "CUSTOMER" && (
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
  const { data: siteSettings } = useGetSiteSettingsQuery();
  const logoSrc = siteSettings?.logo || "/assets/logo/pujarighar.png";
  const companyName = locale === "bn"
    ? (siteSettings?.company_name_bn || "পূজারিঘর")
    : (siteSettings?.company_name_en || "PujariGhar");

  const navLink = (href: string, icon: string, lbl: string) => {
    const full = `/${locale}${href}`;
    const active =
      pathname === full ||
      (pathname.startsWith(full + "/") && full !== `/${locale}`);
    return (
      <Link
        key={href}
        href={full}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
          active
            ? "bg-amber-50 text-amber-700 font-medium"
            : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <span className="text-base">{icon}</span>
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
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

        {/* Nav links — driven by menu */}
        <div className="flex-1 overflow-y-auto py-2">
          {menu.map((item, i) => {
            if (item.type === "link") {
              return navLink(item.href, item.icon, label(item, locale));
            }
            // group
            const grp = item as NavGroupItem;
            return (
              <div key={i} className="border-t border-gray-100 mt-2 pt-2">
                <p className="px-4 py-1 text-xs text-gray-400 font-medium uppercase tracking-wide">
                  {label(grp, locale)}
                </p>
                {grp.items.map(sub =>
                  navLink(sub.href, sub.icon, label(sub, locale)),
                )}
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
              {currentUser.role === "CUSTOMER" && (
                <div className="flex items-center gap-1.5 bg-amber-50 rounded-lg px-2.5 py-1.5">
                  <div>
                    <p className="text-[10px] text-amber-600">{locale === "bn" ? "ক্যাশব্যাক" : "Cashback Balance"}</p>
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

// ── Navbar ────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAdmin = pathname.includes("/admin");
  const [mobileOpen, setMobileOpen] = useState(false);

  const { isAuthenticated, logout, updateUser } = useAuthStore();
  const [logoutMutation] = useLogoutMutation();

  const { data: me, error: meError } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (meError && "status" in meError && meError.status === 401) logout();
  }, [meError, logout]);

  useEffect(() => {
    if (me) updateUser(me);
  }, [me]);

  const currentUser = isAuthenticated ? (me ?? null) : null;
  const role = currentUser?.role ?? null;

  const { data: siteSettings } = useGetSiteSettingsQuery();
  const logoSrc = siteSettings?.logo || "/assets/logo/pujarighar.png";
  const companyName = locale === "bn"
    ? (siteSettings?.company_name_bn || "পূজারিঘর")
    : (siteSettings?.company_name_en || "PujariGhar");

  // Active menu: backend-driven for authenticated users, guest fallback otherwise
  const menu: NavItem[] = currentUser?.nav_menu ?? GUEST_MENU;

  const showCart = !isAuthenticated || role === "CUSTOMER";

  // Search
  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  useEffect(() => { setQuery(searchParams.get("search") ?? ""); }, [searchParams]);

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
    logout();
    router.push(`/${locale}`);
  };

  const handleMobileSearch = (q: string) => {
    router.push(`/${locale}/products${q ? `?search=${encodeURIComponent(q)}` : ""}`);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-[1010]">
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
              className="md:hidden text-gray-600 hover:text-amber-600 p-1 -ml-1"
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
              role === "ADMIN" || role === "WAREHOUSE"
                ? `/${locale}/admin/orders/new`
                : role === "DELIVERY"
                  ? `/${locale}/delivery/orders`
                  : `/${locale}`
            }
            className="flex-1 md:flex-none shrink-0"
          >
            <Image src={logoSrc} alt={companyName} width={94} height={40} priority className="h-10 w-auto object-contain" />
          </Link>

          {/* Desktop: all menu items in order — links and group dropdowns together */}
          <div className="hidden md:flex items-center overflow-x-auto flex-1 gap-1 min-w-0">
            {menu.map((item, i) => {
              if (item.type === "group") {
                return (
                  <NavDropdown key={i} locale={locale} pathname={pathname} group={item} />
                );
              }
              const full = `/${locale}${item.href}`;
              const newOrderPath = `/${locale}/admin/orders/new`;
              const active =
                pathname === full ||
                (pathname.startsWith(full + "/") &&
                  full !== `/${locale}` &&
                  pathname !== newOrderPath);
              return (
                <Link
                  key={item.href}
                  href={full}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
                    active
                      ? "bg-amber-50 text-amber-700 font-medium"
                      : "text-gray-600 hover:text-amber-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{item.icon}</span>
                  {locale === "bn" ? item.label_bn : item.label_en}
                </Link>
              );
            })}
          </div>

          {/* Search — only for guest/customer */}
          <form
            onSubmit={handleSearch}
            className={`shrink-0 justify-end ${
              isAdmin || role === "ADMIN" || role === "WAREHOUSE" || role === "DELIVERY"
                ? "hidden"
                : "hidden md:flex w-64 lg:w-80"
            }`}
          >
            <div className="relative w-full">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t("common.search")}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-gray-50"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-3 shrink-0">
            {role === "ADMIN" && (
              <Link
                href={`/${locale}/admin/settings`}
                className="text-gray-500 hover:text-amber-600 transition-colors"
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
              <>
                <Link href={`/${locale}/auth/login`} className="text-gray-600 hover:text-amber-600 text-sm">
                  {t("nav.login")}
                </Link>
                <Link href={`/${locale}/auth/register`} className="btn-primary text-sm">
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

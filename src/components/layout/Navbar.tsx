"use client";

import { useGetMeQuery, useLogoutMutation } from "@/api/auth/authApi";
import { User } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useGuestCartStore } from "@/store/guestCartStore";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import NotificationBell from "@/components/ui/NotificationBell";
import LanguageSwitcher from "./LanguageSwitcher";

const ADMIN_LINKS = [
  { href: "/admin/orders/new", icon: "🧾", label_bn: "নতুন অর্ডার", label_en: "New Order" },
  { href: "/admin/orders",     icon: "🛍️", label_bn: "অর্ডার",      label_en: "Orders" },
  { href: "/admin/products",   icon: "📦", label_bn: "পণ্য",         label_en: "Products" },
  { href: "/admin/packages",   icon: "🎁", label_bn: "প্যাকেজ",      label_en: "Packages" },
  { href: "/admin/categories", icon: "🏷️", label_bn: "কেটাগরি",     label_en: "Categories" },
  { href: "/admin/inventory",  icon: "🏭", label_bn: "গুদাম",        label_en: "Inventory" },
  { href: "/admin/users",      icon: "👥", label_bn: "ব্যবহারকারী",  label_en: "Users" },
  { href: "/admin/dashboard",  icon: "📊", label_bn: "ড্যাশবোর্ড",  label_en: "Dashboard" },
];

const ACCOUNTING_LINKS = [
  { href: "/admin/accounting/journal", icon: "📓", label_bn: "জার্নাল",  label_en: "Journal" },
  { href: "/admin/accounting/ledger",  icon: "📒", label_bn: "খাতা",     label_en: "Ledger" },
  { href: "/admin/accounting/reports", icon: "📊", label_bn: "রিপোর্ট", label_en: "Reports" },
];

const BANNER_LINKS = [
  { href: "/admin/slides",  icon: "🖼️", label_bn: "হিরো স্লাইডার", label_en: "Hero Slider" },
  { href: "/admin/banners", icon: "🎯", label_bn: "অফার ব্যানার",   label_en: "Offer Banners" },
];



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
  const initials = (user.profile?.full_name_en || user.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-amber-600 transition-colors"
      >
        <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">
          {initials}
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
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
            <div className="px-4 py-2 border-b border-gray-50">
              <p className="text-xs font-medium text-gray-800 truncate">
                {user.profile?.full_name_bn ||
                  user.profile?.full_name_en ||
                  "—"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
              <p className="text-xs text-amber-500 font-medium mt-0.5">
                {user.role}
              </p>
            </div>

            <Link
              href={`/${locale}/profile`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
            >
              <span>👤</span> {t("nav.profile")}
            </Link>

            {user.role === "CUSTOMER" && (
              <Link
                href={`/${locale}/orders`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
              >
                <span>📦</span> {t("nav.orders")}
              </Link>
            )}

            <Link
              href={`/${locale}/profile/change-password`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
            >
              <span>🔒</span> {t("auth.changePassword")}
            </Link>

            <hr className="my-1 border-gray-100" />

            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <span>↩</span> {t("nav.logout")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function NavDropdown({ locale, pathname, links, icon, label_bn, label_en }: {
  locale: string; pathname: string
  links: { href: string; icon: string; label_bn: string; label_en: string }[]
  icon: string; label_bn: string; label_en: string
}) {
  const [open, setOpen] = useState(false);
  const isActive = links.some(l => pathname.startsWith(`/${locale}${l.href}`));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
          isActive ? "bg-amber-50 text-amber-700 font-medium" : "text-gray-600 hover:text-amber-600 hover:bg-gray-50"
        }`}
      >
        <span>{icon}</span>
        <span>{locale === "bn" ? label_bn : label_en}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
            {links.map(({ href, icon: ic, label_bn: lbn, label_en: len }) => {
              const full = `/${locale}${href}`;
              const active = pathname.startsWith(full);
              return (
                <Link key={href} href={full} onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs transition-colors ${
                    active ? "bg-amber-50 text-amber-700 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-amber-600"
                  }`}
                >
                  <span>{ic}</span>
                  {locale === "bn" ? lbn : len}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}


function MobileMenu({
  locale, pathname, role, currentUser, t,
  onClose, onLogout, onSearch,
}: {
  locale: string; pathname: string
  role: string | null; currentUser: User | null
  t: ReturnType<typeof useTranslations>
  onClose: () => void; onLogout: () => void
  onSearch: (q: string) => void
}) {
  const [q, setQ] = useState('')

  const navLink = (href: string, icon: string, label: string) => {
    const full   = href.startsWith('/') ? href : `/${locale}${href.startsWith('/') ? href : '/' + href}`
    const active = pathname === full || (pathname.startsWith(full + '/') && full !== `/${locale}`)
    return (
      <Link key={href} href={full} onClick={onClose}
        className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
          active ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span className="text-base">{icon}</span>
        {label}
      </Link>
    )
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(q.trim())
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      {/* Drawer */}
      <div className="fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <span className="text-lg font-bold text-amber-600">{t('common.appName')}</span>
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
              type="text" value={q} onChange={e => setQ(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-gray-50"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </form>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto py-2">
          {role === 'ADMIN' || role === 'WAREHOUSE' ? (
            <>
              {ADMIN_LINKS.map(l => navLink(`/${locale}${l.href}`, l.icon, locale === 'bn' ? l.label_bn : l.label_en))}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <p className="px-4 py-1 text-xs text-gray-400 font-medium uppercase tracking-wide">
                  {locale === 'bn' ? 'হিসাব' : 'Accounting'}
                </p>
                {ACCOUNTING_LINKS.map(l => navLink(`/${locale}${l.href}`, l.icon, locale === 'bn' ? l.label_bn : l.label_en))}
              </div>
              <div className="border-t border-gray-100 mt-2 pt-2">
                <p className="px-4 py-1 text-xs text-gray-400 font-medium uppercase tracking-wide">
                  {locale === 'bn' ? 'ব্যানার' : 'Banners'}
                </p>
                {BANNER_LINKS.map(l => navLink(`/${locale}${l.href}`, l.icon, locale === 'bn' ? l.label_bn : l.label_en))}
              </div>
            </>
          ) : role === 'DELIVERY' ? (
            navLink(`/${locale}/delivery/orders`, '🚚', t('nav.delivery'))
          ) : (
            <>
              {navLink(`/${locale}`, '🏠', t('nav.home'))}
              {navLink(`/${locale}/products`, '🪔', t('nav.products'))}
              {navLink(`/${locale}/packages`, '🎁', t('nav.packages'))}
              {navLink(`/${locale}/track`, '📦', locale === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Order')}
              {role === 'CUSTOMER' && navLink(`/${locale}/orders`, '🛍️', t('nav.orders'))}
            </>
          )}
        </div>

        {/* Footer: user info or login */}
        <div className="border-t border-gray-100 p-4">
          {currentUser ? (
            <div className="space-y-1">
              <p className="text-xs text-gray-500 truncate">{currentUser.profile?.full_name_bn || currentUser.email}</p>
              <div className="flex gap-2 mt-2">
                <Link href={`/${locale}/profile`} onClick={onClose}
                  className="flex-1 btn-secondary text-xs text-center py-1.5">
                  {t('nav.profile')}
                </Link>
                <button onClick={() => { onClose(); onLogout() }}
                  className="flex-1 text-xs text-red-500 border border-red-200 rounded-lg py-1.5 hover:bg-red-50">
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href={`/${locale}/auth/login`} onClick={onClose}
                className="flex-1 btn-secondary text-xs text-center py-1.5">
                {t('nav.login')}
              </Link>
              <Link href={`/${locale}/auth/register`} onClick={onClose}
                className="flex-1 btn-primary text-xs text-center py-1.5">
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

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

  // ── Source of truth: validate session against the API ──────────────────────
  const { data: me, error: meError } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });

  // If token is expired / invalid → force logout
  useEffect(() => {
    if (meError && "status" in meError && meError.status === 401) {
      logout();
    }
  }, [meError, logout]);

  // Keep auth store in sync with the fresh profile from API
  useEffect(() => {
    if (me) updateUser(me);
  }, [me]);

  // The actual logged-in user (null if API hasn't confirmed)
  const currentUser = isAuthenticated ? (me ?? null) : null;
  const role = currentUser?.role ?? null;

  // Cart counts
  const authItemCount = useCartStore(s => s.itemCount);
  const guestItems = useGuestCartStore(s => s.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const guestCount = mounted
    ? guestItems.reduce((s, i) => s + i.quantity, 0)
    : 0;
  const cartCount = isAuthenticated ? authItemCount : guestCount;
  const showCart = !isAuthenticated || role === "CUSTOMER";

  // Search
  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  useEffect(() => {
    setQuery(searchParams.get("search") ?? "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(
      `/${locale}/products${q ? `?search=${encodeURIComponent(q)}` : ""}`,
    );
  };

  const handleLogout = async () => {
    try {
      const Cookies = (await import("js-cookie")).default;
      await logoutMutation({
        refresh: Cookies.get("refresh_token") ?? "",
      }).unwrap();
    } catch {}
    logout();
    router.push(`/${locale}/auth/login`);
  };

  const handleMobileSearch = (q: string) => {
    router.push(`/${locale}/products${q ? `?search=${encodeURIComponent(q)}` : ''}`)
  }

  return (
    <nav className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-50">
      {mobileOpen && (
        <MobileMenu
          locale={locale} pathname={pathname}
          role={role} currentUser={currentUser}
          t={t}
          onClose={() => setMobileOpen(false)}
          onLogout={handleLogout}
          onSearch={handleMobileSearch}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden text-gray-600 hover:text-amber-600 p-1 -ml-1"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Brand — admin goes to POS, others go home */}
          <Link
            href={role === "ADMIN" || role === "WAREHOUSE" ? `/${locale}/admin/orders/new` : `/${locale}`}
            className="text-xl font-bold text-amber-600 flex-1 md:flex-none shrink-0"
          >
            {t("common.appName")}
          </Link>

          {/* Nav links — driven by API-confirmed role */}
          <div className="hidden md:flex items-center overflow-x-auto flex-1 gap-1 min-w-0">
            {role === "ADMIN" || role === "WAREHOUSE" ? (
              ADMIN_LINKS.map(({ href, label_bn, label_en, icon }) => {
                const full = `/${locale}${href}`;
                const posPath = `/${locale}/admin/orders/new`;
                const active =
                  pathname === full ||
                  (href !== "/admin/orders/new" &&
                    href !== "/admin/dashboard" &&
                    pathname.startsWith(full + "/") &&
                    !(href === "/admin/orders" && pathname === posPath));
                return (
                  <Link key={href} href={full}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
                      active ? "bg-amber-50 text-amber-700 font-medium" : "text-gray-600 hover:text-amber-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>{icon}</span>
                    {locale === "bn" ? label_bn : label_en}
                  </Link>
                );
              })
            ) : role === "DELIVERY" ? (
              <Link href={`/${locale}/delivery/orders`} className="text-gray-600 hover:text-amber-600 text-sm">
                {t("nav.delivery")}
              </Link>
            ) : (
              <>
                <Link href={`/${locale}`} className="text-gray-600 hover:text-amber-600 text-sm px-2">
                  {t("nav.home")}
                </Link>
                <Link href={`/${locale}/products`} className="text-gray-600 hover:text-amber-600 text-sm px-2">
                  {t("nav.products")}
                </Link>
                <Link href={`/${locale}/packages`} className="text-gray-600 hover:text-amber-600 text-sm px-2">
                  {t("nav.packages")}
                </Link>
                <Link href={`/${locale}/track`} className="text-gray-600 hover:text-amber-600 text-sm px-2">
                  {locale === 'bn' ? 'অর্ডার ট্র্যাক' : 'Track Order'}
                </Link>
              </>
            )}
          </div>

          {/* Banners + Accounting dropdowns — shrink-0 so they stay in place */}
          {(role === "ADMIN" || role === "WAREHOUSE") && (
            <div className="hidden md:flex items-center gap-1 shrink-0">
              <NavDropdown locale={locale} pathname={pathname}
                links={BANNER_LINKS} icon="🎨"
                label_bn="ব্যানার" label_en="Banners" />
              <NavDropdown locale={locale} pathname={pathname}
                links={ACCOUNTING_LINKS} icon="📒"
                label_bn="হিসাব" label_en="Accounting" />
            </div>
          )}

          {/* Search — hidden for admin/warehouse users */}
          <form
            onSubmit={handleSearch}
            className={`shrink-0 justify-end ${isAdmin || role === "ADMIN" || role === "WAREHOUSE" ? "hidden" : "hidden md:flex w-64 lg:w-80"}`}
          >
            <div className="relative w-full">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t("common.search")}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 bg-gray-50"
              />
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher />
            {currentUser && <NotificationBell />}

            {showCart && (
              <Link
                href={`/${locale}/cart`}
                className="relative text-gray-600 hover:text-amber-600"
              >
                🛒
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {currentUser ? (
              <ProfileDropdown
                locale={locale}
                user={currentUser}
                onLogout={handleLogout}
                t={t}
              />
            ) : (
              <>
                <Link
                  href={`/${locale}/auth/login`}
                  className="text-gray-600 hover:text-amber-600 text-sm"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href={`/${locale}/auth/register`}
                  className="btn-primary text-sm"
                >
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

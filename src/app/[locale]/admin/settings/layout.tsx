// Admin settings changes often (payment methods, discount config, etc.) and
// is only ever reached by an authenticated admin — it has no business being
// statically cached/prerendered per locale. That's the likely cause of a
// recurring bug where the English route kept serving a stale copy of this
// page (missing an icon added in a later change) while the Bangla route,
// coincidentally revalidated more recently, showed the fix — same client
// component, same code, different cached snapshot per locale path. Forcing
// dynamic rendering here means every request always gets the current build.
export const dynamic = "force-dynamic";

export default function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

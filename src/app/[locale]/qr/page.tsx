import { notFound, redirect } from "next/navigation";

// Lands here when a product/variant QR sticker (see
// admin/products/ProductQrCode.tsx) is scanned by any plain camera app
// instead of the staff mobile app's own in-app scanner — the sticker
// encodes this page's URL (not a bare "PG-SKU:..."/"PG-VARIANT:..." string)
// specifically so a generic scan opens something real instead of just
// showing unreadable text. Resolves the code server-side via the same
// public endpoint the backend exposes for this (`resolve_qr_code` — no
// product data duplicated here, just enough to redirect) and forwards
// straight to the normal product detail page.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

interface Props {
  params: { locale: string };
  searchParams: { code?: string };
}

async function resolveCode(code: string): Promise<{ product_id: string } | null> {
  try {
    const res = await fetch(`${API_URL}/api/products/resolve-qr/?code=${encodeURIComponent(code)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function QrRedirectPage({ params, searchParams }: Props) {
  const code = searchParams.code;
  if (!code) notFound();

  const resolved = await resolveCode(code);
  if (!resolved) notFound();

  // The product page itself already accepts a raw id in place of a slug
  // and redirects on to the canonical slug URL once resolved (see its own
  // UUID_RE check) — no need to look up the slug again here.
  redirect(`/${params.locale}/products/${resolved.product_id}`);
}

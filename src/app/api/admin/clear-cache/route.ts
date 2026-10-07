import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

// Clears both cache layers this app has: Django's response cache (the real
// admin-permission gate lives there — this route doesn't re-check role, it
// just forwards the caller's own token and trusts Django's 403/401), then
// Next's entire fetch-cache tree via the root layout, which covers every
// `revalidate: N` fetch in the app without needing to enumerate pages.
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth) {
    return NextResponse.json({ ok: false, message: "Missing authorization" }, { status: 401 });
  }

  const res = await fetch(`${API_URL}/api/admin/clear-cache/`, {
    method: "POST",
    headers: { Authorization: auth },
  });
  if (!res.ok) {
    return NextResponse.json({ ok: false, message: "Backend cache clear failed" }, { status: res.status });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

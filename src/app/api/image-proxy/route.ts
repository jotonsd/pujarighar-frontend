import { NextRequest, NextResponse } from "next/server";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

// Server-to-server fetch of a product image, used to carry over images when
// duplicating a product (see admin/products/new/page.tsx). Needed because
// production serves /media/ directly from nginx (not through Django), which
// sends no CORS headers — a direct browser fetch() of the image URL is
// silently blocked by the browser's CORS policy. Fetching here instead,
// server-side, has no CORS restriction, and we stream the bytes back to the
// browser same-origin.
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !url.startsWith(API_ORIGIN)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, { headers: { "content-type": contentType } });
}

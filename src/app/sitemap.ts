import { locales } from "@/lib/i18n";
import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

const STATIC_PATHS = ["", "/products", "/packages", "/track", "/privacy-policy", "/terms-of-service", "/return-policy"];

interface SitemapProduct {
  id: string;
  slug: string;
  is_package: boolean;
  updated_at: string;
}

async function fetchAllProducts(isPackage: boolean): Promise<SitemapProduct[]> {
  const all: SitemapProduct[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${API_URL}/api/products/?is_package=${isPackage}&page=${page}&page_size=100`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) break;
    const json = await res.json();
    const items: SitemapProduct[] = json.data ?? [];
    all.push(...items);
    const totalPages = json.pagination?.total_pages ?? 1;
    if (page >= totalPages || items.length === 0) break;
    page += 1;
  }
  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.6,
      });
    }
  }

  let products: SitemapProduct[] = [];
  let packages: SitemapProduct[] = [];
  try {
    [products, packages] = await Promise.all([
      fetchAllProducts(false),
      fetchAllProducts(true),
    ]);
  } catch {
    // Backend unreachable at build time — ship the static entries only rather than failing the build.
  }

  for (const p of products) {
    for (const locale of locales) {
      entries.push({
        url: `${SITE_URL}/${locale}/products/${p.slug}`,
        lastModified: p.updated_at,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  for (const p of packages) {
    for (const locale of locales) {
      entries.push({
        url: `${SITE_URL}/${locale}/packages/${p.slug}`,
        lastModified: p.updated_at,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}

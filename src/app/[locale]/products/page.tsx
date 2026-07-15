import OfferBanners from "@/components/products/OfferBanners";
import { Brand, Category, Product } from "@/lib/types";
import type { Metadata } from "next";
import ProductsPageClient from "./ProductsPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

// Uses useSearchParams (filters) client-side — keep dynamic to avoid a static-export CSR bailout.
export const dynamic = "force-dynamic";

interface Props {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = params.locale;
  const isBn = locale === "bn";
  return {
    title: isBn ? "সকল পণ্য | PujariGhar" : "All Puja (Pooja) Products | PujariGhar",
    description: isBn
      ? "পূজারিঘরের সকল পূজার সামগ্রী দেখুন ও ফিল্টার করুন — মূল্য, কেটাগরি ও ব্র্যান্ড অনুযায়ী।"
      : "Browse and filter all puja (pooja) items from PujariGhar by price, category, and brand.",
    alternates: {
      canonical: `${SITE_URL}/${locale}/products`,
      languages: {
        bn: `${SITE_URL}/bn/products`,
        en: `${SITE_URL}/en/products`,
      },
    },
  };
}

async function getInitialProducts(searchParams: Props["searchParams"]): Promise<{
  products: Product[];
  totalPages: number;
}> {
  const search = typeof searchParams.search === "string" ? searchParams.search : "";
  const category = typeof searchParams.category === "string" ? searchParams.category : "";
  const offers = searchParams.offers === "true";

  const p = new URLSearchParams({ page: "1", is_package: "false" });
  if (search) p.set("search", search);
  if (category) p.set("category", category);
  if (offers) p.set("has_discount", "true");

  try {
    const res = await fetch(`${API_URL}/api/products/?${p}`, {
      cache: "no-store",
    });
    if (!res.ok) return { products: [], totalPages: 1 };
    const json = await res.json();
    return {
      products: json.data ?? [],
      totalPages: json.pagination?.total_pages ?? 1,
    };
  } catch {
    return { products: [], totalPages: 1 };
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/api/categories/`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function getBrands(): Promise<Brand[]> {
  try {
    const res = await fetch(`${API_URL}/api/brands/`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function ProductsPage({ searchParams }: Props) {
  const [{ products, totalPages }, categories, brands] = await Promise.all([
    getInitialProducts(searchParams),
    getCategories(),
    getBrands(),
  ]);
  return (
    <ProductsPageClient
      initialProducts={products}
      initialTotalPages={totalPages}
      initialCategories={categories}
      initialBrands={brands}
      offerBanners={<OfferBanners />}
    />
  );
}

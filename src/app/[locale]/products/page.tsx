import OfferBanners from "@/components/products/OfferBanners";
import { Brand, Category, Product } from "@/lib/types";
import { getFAQPageSchema } from "@/lib/structuredData";
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

async function getSelectedCategory(searchParams: Props["searchParams"]): Promise<Category | null> {
  const categoryId = typeof searchParams.category === "string" ? searchParams.category : "";
  if (!categoryId) return null;
  try {
    const res = await fetch(`${API_URL}/api/categories/`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    const categories: Category[] = json.data ?? [];
    return categories.find(c => c.id === categoryId) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = params.locale;
  const isBn = locale === "bn";
  const category = await getSelectedCategory(searchParams);

  const canonical = typeof searchParams.category === "string"
    ? `${SITE_URL}/${locale}/products?category=${searchParams.category}`
    : `${SITE_URL}/${locale}/products`;

  if (category) {
    const title = (isBn ? category.seo_title_bn : category.seo_title_en) || (isBn ? category.name_bn : category.name_en);
    const description = (isBn ? category.meta_description_bn : category.meta_description_en) ||
      (isBn ? `${category.name_bn} — পূজারিঘরের সকল পণ্য দেখুন` : `Browse all ${category.name_en} products from PujariGhar`);
    return {
      title: `${title} | PujariGhar`,
      description,
      alternates: { canonical },
    };
  }

  return {
    title: isBn ? "সকল পণ্য | PujariGhar" : "All Puja (Pooja) Products | PujariGhar",
    description: isBn
      ? "পূজারিঘরের সকল পূজার সামগ্রী দেখুন ও ফিল্টার করুন — মূল্য, কেটাগরি ও ব্র্যান্ড অনুযায়ী।"
      : "Browse and filter all puja (pooja) items from PujariGhar by price, category, and brand.",
    alternates: {
      canonical,
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

export default async function ProductsPage({ params, searchParams }: Props) {
  const isBn = params.locale === "bn";
  const [{ products, totalPages }, categories, brands] = await Promise.all([
    getInitialProducts(searchParams),
    getCategories(),
    getBrands(),
  ]);

  const categoryId = typeof searchParams.category === "string" ? searchParams.category : "";
  const selectedCategory = categoryId ? categories.find(c => c.id === categoryId) ?? null : null;
  const categoryDescription = selectedCategory
    ? (isBn ? selectedCategory.description_bn : selectedCategory.description_en)
    : "";
  const faqSchema = selectedCategory ? getFAQPageSchema(selectedCategory.faqs, isBn) : null;

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <ProductsPageClient
        initialProducts={products}
        initialTotalPages={totalPages}
        initialCategories={categories}
        initialBrands={brands}
        offerBanners={<OfferBanners />}
      />
      {selectedCategory && (categoryDescription || selectedCategory.faqs.length > 0) && (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          {categoryDescription && (
            <div className="prose prose-sm sm:prose-base max-w-none text-gray-600 whitespace-pre-line">
              {categoryDescription}
            </div>
          )}
          {selectedCategory.faqs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {isBn ? "সচরাচর জিজ্ঞাসা" : "Frequently Asked Questions"}
              </h2>
              <div className="space-y-3">
                {selectedCategory.faqs.map((faq, i) => (
                  <details key={i} className="rounded-xl border border-gray-100 bg-white p-4 group">
                    <summary className="font-medium text-gray-800 cursor-pointer select-none">
                      {isBn ? faq.question_bn : faq.question_en}
                    </summary>
                    <p className="text-sm text-gray-500 mt-2">
                      {isBn ? faq.answer_bn : faq.answer_en}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

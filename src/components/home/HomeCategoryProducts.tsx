import { CategoryWithProducts } from "@/api/products/productsApi";
import HomeCategoryProductsClient from "./HomeCategoryProductsClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

async function getPopularByCategory(): Promise<CategoryWithProducts[]> {
  try {
    const res = await fetch(`${API_URL}/api/products/popular-by-category/`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const raw: CategoryWithProducts[] = json.data ?? [];
    // Only show a category row in full sets of 6 — fewer than 6 isn't worth a row.
    return raw
      .map(({ category, products }) => ({
        category,
        products: products.slice(0, Math.floor(products.length / 6) * 6),
      }))
      .filter(({ products }) => products.length > 0);
  } catch {
    return [];
  }
}

export default async function HomeCategoryProducts() {
  const categories = await getPopularByCategory();
  return <HomeCategoryProductsClient categories={categories} />;
}

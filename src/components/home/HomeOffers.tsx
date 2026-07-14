import { Product } from "@/lib/types";
import HomeOffersClient from "./HomeOffersClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

async function getOffers(): Promise<Product[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/products/?is_package=false&has_discount=true&ordering=discount_desc&page_size=12`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomeOffers() {
  const products = await getOffers();
  return <HomeOffersClient products={products} />;
}

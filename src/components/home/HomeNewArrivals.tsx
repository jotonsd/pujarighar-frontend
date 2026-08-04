import { Product } from "@/lib/types";
import HomeNewArrivalsClient from "./HomeNewArrivalsClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

async function getNewArrivals(): Promise<Product[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/products/?is_package=false&ordering=newest&page_size=12`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomeNewArrivals() {
  const products = await getNewArrivals();
  return <HomeNewArrivalsClient products={products} />;
}

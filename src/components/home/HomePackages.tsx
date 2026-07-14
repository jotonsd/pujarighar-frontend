import { Product } from "@/lib/types";
import HomePackagesClient from "./HomePackagesClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

async function getPackages(): Promise<Product[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/products/?is_package=true&page_size=6`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePackages() {
  const packages = await getPackages();
  return <HomePackagesClient packages={packages} />;
}

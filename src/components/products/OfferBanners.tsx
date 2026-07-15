import { Banner } from "@/api/banners/bannersApi";
import OfferBannersClient from "./OfferBannersClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

async function getBanners(): Promise<Banner[]> {
  try {
    const res = await fetch(`${API_URL}/api/banners/`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function OfferBanners() {
  const banners = await getBanners();
  return <OfferBannersClient banners={banners} />;
}

import { HeroSlide } from "@/api/heroSlides/heroSlidesApi";
import HeroSliderClient from "./HeroSliderClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    // Matches the other homepage sections (HomeCategoryProducts,
    // HomePackages, HomeNewArrivals) — hero slides are admin-edited
    // marketing banners, not real-time data, so there's no reason this was
    // the one fetch on the page forcing a fresh, uncached round-trip to
    // the backend on every single request. Since this component isn't
    // wrapped in Suspense, that no-store fetch blocked the ENTIRE page's
    // HTML (including the LCP hero image's own src) behind it.
    const res = await fetch(`${API_URL}/api/hero-slides/`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function HeroSlider() {
  const slides = await getHeroSlides();
  return <HeroSliderClient slides={slides} />;
}

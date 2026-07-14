import { HeroSlide } from "@/api/heroSlides/heroSlidesApi";
import HeroSliderClient from "./HeroSliderClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
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

import OfferBanners from "@/components/products/OfferBanners";
import TrackingPageClient from "./TrackingPageClient";

export default function TrackingPage({ params }: { params: { id: string } }) {
  return <TrackingPageClient id={params.id} offerBanners={<OfferBanners />} />;
}

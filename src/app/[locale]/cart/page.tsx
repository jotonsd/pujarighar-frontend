import OfferBanners from "@/components/products/OfferBanners";
import CartClient from "./CartClient";

export default function CartPage() {
  return <CartClient offerBanners={<OfferBanners />} />;
}

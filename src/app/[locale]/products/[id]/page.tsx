import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

interface ProductImage {
  image: string;
}

interface ProductDetail {
  id: string;
  name_bn: string;
  name_en: string;
  description_bn: string | null;
  description_en: string | null;
  sku: string;
  brand_name_en: string | null;
  category_name_en: string | null;
  unit_price: string;
  effective_price: string;
  active_discount_type: string | null;
  stock_on_hand: string;
  images: ProductImage[];
  average_rating: number | null;
  review_count: number;
}

interface Props {
  params: { locale: string; id: string };
}

async function getProduct(id: string): Promise<ProductDetail | null> {
  try {
    const res = await fetch(`${API_URL}/api/products/${id}/`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.id);
  const isBn = params.locale === "bn";
  const url = `${SITE_URL}/${params.locale}/products/${params.id}`;

  if (!product) {
    return {
      title: isBn ? "পণ্য পাওয়া যায়নি | পূজারিঘর" : "Product Not Found | PujariGhar",
    };
  }

  const name = isBn ? product.name_bn : product.name_en;
  const rawDesc = (isBn ? product.description_bn : product.description_en) || "";
  const description = (rawDesc || (isBn ? `${name} — পূজারিঘর থেকে অর্ডার করুন` : `Buy ${name} online from PujariGhar`)).slice(0, 160);
  const image = product.images?.[0]?.image;

  return {
    title: `${name} | PujariGhar`,
    description,
    alternates: {
      canonical: url,
      languages: {
        bn: `${SITE_URL}/bn/products/${params.id}`,
        en: `${SITE_URL}/en/products/${params.id}`,
      },
    },
    openGraph: {
      title: name,
      description,
      url,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProduct(params.id);

  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: params.locale === "bn" ? product.name_bn : product.name_en,
        image: product.images?.map(img => img.image) ?? [],
        description: ((params.locale === "bn" ? product.description_bn : product.description_en) || "").slice(0, 500),
        sku: product.sku,
        ...(product.brand_name_en ? { brand: { "@type": "Brand", name: product.brand_name_en } } : {}),
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/${params.locale}/products/${params.id}`,
          priceCurrency: "BDT",
          price: product.active_discount_type ? product.effective_price : product.unit_price,
          availability: Number(product.stock_on_hand) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
        ...(product.average_rating && product.review_count > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.average_rating,
                reviewCount: product.review_count,
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient id={params.id} />
    </>
  );
}

import type { Metadata } from "next";
import PackageDetailClient from "./PackageDetailClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

interface ProductImage {
  image: string;
}

interface PackageDetail {
  id: string;
  name_bn: string;
  name_en: string;
  description_bn: string | null;
  description_en: string | null;
  sku: string;
  unit_price: string;
  stock_on_hand: string;
  images: ProductImage[];
  average_rating: number | null;
  review_count: number;
}

interface Props {
  params: { locale: string; id: string };
}

async function getPackage(id: string): Promise<PackageDetail | null> {
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
  const pkg = await getPackage(params.id);
  const isBn = params.locale === "bn";
  const url = `${SITE_URL}/${params.locale}/packages/${params.id}`;

  if (!pkg) {
    return {
      title: isBn ? "প্যাকেজ পাওয়া যায়নি | পূজারিঘর" : "Package Not Found | PujariGhar",
    };
  }

  const name = isBn ? pkg.name_bn : pkg.name_en;
  const rawDesc = (isBn ? pkg.description_bn : pkg.description_en) || "";
  const description = (rawDesc || (isBn ? `${name} — পূজারিঘর থেকে অর্ডার করুন` : `Buy ${name} package online from PujariGhar`)).slice(0, 160);
  const image = pkg.images?.[0]?.image;

  return {
    title: `${name} | PujariGhar`,
    description,
    alternates: {
      canonical: url,
      languages: {
        bn: `${SITE_URL}/bn/packages/${params.id}`,
        en: `${SITE_URL}/en/packages/${params.id}`,
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

export default async function PackageDetailPage({ params }: Props) {
  const pkg = await getPackage(params.id);

  const jsonLd = pkg
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: params.locale === "bn" ? pkg.name_bn : pkg.name_en,
        image: pkg.images?.map(img => img.image) ?? [],
        description: ((params.locale === "bn" ? pkg.description_bn : pkg.description_en) || "").slice(0, 500),
        sku: pkg.sku,
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/${params.locale}/packages/${params.id}`,
          priceCurrency: "BDT",
          price: pkg.unit_price,
          availability: Number(pkg.stock_on_hand) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
        ...(pkg.average_rating && pkg.review_count > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: pkg.average_rating,
                reviewCount: pkg.review_count,
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
      <PackageDetailClient id={params.id} />
    </>
  );
}

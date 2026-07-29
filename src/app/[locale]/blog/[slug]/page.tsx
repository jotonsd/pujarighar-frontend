import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getBreadcrumbListSchema } from "@/lib/structuredData";
import { BlogPost } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

interface Props {
  params: { locale: string; slug: string };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_URL}/api/blog/slug/${slug}/`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPost(params.slug);
  const isBn = params.locale === "bn";

  if (!post) {
    return {
      title: isBn ? "পোস্ট পাওয়া যায়নি | পূজারিঘর" : "Post Not Found | PujariGhar",
    };
  }

  const title = (isBn ? post.seo_title_bn : post.seo_title_en) || (isBn ? post.title_bn : post.title_en);
  const description =
    (isBn ? post.meta_description_bn : post.meta_description_en) ||
    stripHtml(isBn ? post.body_bn : post.body_en).slice(0, 160);
  const canonical = post.canonical_url || `${SITE_URL}/${params.locale}/blog/${post.slug}`;

  return {
    title: `${title} | PujariGhar`,
    description,
    alternates: {
      canonical,
      languages: {
        bn: `${SITE_URL}/bn/blog/${post.slug}`,
        en: `${SITE_URL}/en/blog/${post.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      images: post.cover_image ? [{ url: post.cover_image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const locale = params.locale;
  setRequestLocale(locale);
  const isBn = locale === "bn";

  const post = await getBlogPost(params.slug);
  if (!post) notFound();

  const title = isBn ? post.title_bn : post.title_en;
  const body = isBn ? post.body_bn : post.body_en;
  const url = `${SITE_URL}/${locale}/blog/${post.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: stripHtml(body).slice(0, 500),
    url,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    ...(post.cover_image ? { image: post.cover_image } : {}),
    author: { "@type": "Organization", name: "PujariGhar" },
    publisher: { "@type": "Organization", name: "PujariGhar" },
    mainEntityOfPage: url,
  };

  const breadcrumbSchema = getBreadcrumbListSchema([
    { name: isBn ? "হোম" : "Home", url: `${SITE_URL}/${locale}` },
    { name: isBn ? "ব্লগ" : "Blog", url: `${SITE_URL}/${locale}/blog` },
    { name: title, url },
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
        <Link href={`/${locale}`} className="hover:text-amber-600">{isBn ? "হোম" : "Home"}</Link>
        <span>/</span>
        <Link href={`/${locale}/blog`} className="hover:text-amber-600">{isBn ? "ব্লগ" : "Blog"}</Link>
        <span>/</span>
        <span className="text-gray-500 truncate">{title}</span>
      </nav>

      {post.cover_image && (
        <div className="w-full rounded-2xl overflow-hidden mb-6 bg-gray-50">
          <Image
            src={post.cover_image}
            alt={title}
            width={1980}
            height={960}
            className="w-full h-auto"
            sizes="768px"
            priority
          />
        </div>
      )}

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">{title}</h1>

      {post.published_at && (
        <p className="text-xs text-gray-400 mb-6">
          {new Date(post.published_at).toLocaleDateString(isBn ? "bn-BD" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}

      <div
        className="prose prose-sm sm:prose-base max-w-none rich-text text-gray-700"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </div>
  );
}

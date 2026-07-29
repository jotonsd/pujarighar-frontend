import OfferBanners from "@/components/products/OfferBanners";
import { getCollectionPageSchema } from "@/lib/structuredData";
import { BlogPost } from "@/lib/types";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8020";

interface Props {
  params: { locale: string };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_URL}/api/blog/`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const isBn = params.locale === "bn";
  return {
    title: isBn ? "ব্লগ | পূজারিঘর" : "Blog | PujariGhar",
    description: isBn
      ? "পূজা, রীতিনীতি ও ধর্মীয় সামগ্রী নিয়ে পূজারিঘরের ব্লগ পড়ুন।"
      : "Read PujariGhar's blog on puja rituals, traditions, and religious items.",
    alternates: {
      canonical: `${SITE_URL}/${params.locale}/blog`,
      languages: {
        bn: `${SITE_URL}/bn/blog`,
        en: `${SITE_URL}/en/blog`,
      },
    },
  };
}

export default async function BlogListPage({ params }: Props) {
  const locale = params.locale;
  setRequestLocale(locale);
  const isBn = locale === "bn";

  const posts = await getBlogPosts();

  const jsonLd = getCollectionPageSchema(
    isBn ? "ব্লগ" : "Blog",
    isBn ? "পূজারিঘরের ব্লগ পোস্টসমূহ" : "PujariGhar blog posts",
    `${SITE_URL}/${locale}/blog`,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 pt-3 pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mb-6">
        <OfferBanners />
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-400 text-sm">
          {isBn ? "কোনো ব্লগ পোস্ট নেই।" : "No blog posts yet."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => {
            const title = isBn ? post.title_bn : post.title_en;
            const excerpt = stripHtml(isBn ? post.body_bn : post.body_en).slice(
              0,
              140,
            );
            return (
              <Link
                key={post.id}
                href={`/${locale}/blog/${post.slug}`}
                className="block rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="relative w-full aspect-[1980/960] bg-gray-50">
                  {post.cover_image ? (
                    <Image
                      src={post.cover_image}
                      alt={title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                      {isBn ? "কোনো ছবি নেই" : "No image"}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-gray-800 mb-1.5 line-clamp-2">
                    {title}
                  </h2>
                  <p className="text-sm text-gray-500 line-clamp-3">
                    {excerpt}
                  </p>
                  {post.published_at && (
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(post.published_at).toLocaleDateString(
                        isBn ? "bn-BD" : "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pujarighar.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/*/admin/",
          "/*/delivery/",
          "/*/cart",
          "/*/orders",
          "/*/notifications",
          "/*/profile",
          "/*/auth/",
          "/*/payment/",
          "/*/403",
          "/*/maintenance",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("src/lib/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // /t/<code> short links are generated with the customer-facing domain
  // (see get_short_url in the backend) but the actual lookup/redirect lives
  // on the Django API — proxy transparently so the browser never sees the
  // api.* subdomain.
  async rewrites() {
    return [
      {
        source: "/t/:code",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/t/:code`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8020" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "dev-api.pujarighar.com" },
      { protocol: "https", hostname: "api.pujarighar.com" },
    ],
    // AVIF first — meaningfully smaller than WebP at equivalent quality on
    // browsers that support it; Next falls back to WebP automatically.
    formats: ["image/avif", "image/webp"],
    // Default imageSizes jumps 128 -> 256 -> 384 -> straight into
    // deviceSizes' 640/750/828 tier. Product-grid thumbnails render around
    // 200-435px CSS width (ProductCard's `sizes` prop), so on a 2-3x DPR
    // screen that gap forced Next to serve a 640-828px source for a ~260px
    // slot — most of the "image larger than its displayed dimensions"
    // Lighthouse findings. These extra steps let it pick something close
    // instead.
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 256, 320, 384, 480, 640],
  },
};

export default withNextIntl(nextConfig);

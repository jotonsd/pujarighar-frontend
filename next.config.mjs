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
    // Both forms proxy straight to the backend's trailing-slash URL — the
    // Django route requires one (t/<code>/), and sending it without one
    // would make Django's APPEND_SLASH middleware 301 back to a relative
    // "/t/:code/" Location, which Next's own trailingSlash:false default
    // then strips again before re-matching, looping forever.
    return [
      {
        source: "/t/:code",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/t/:code/`,
      },
      {
        source: "/t/:code/",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/t/:code/`,
      },
    ];
  },
  // Short, brandable link for SMS/social sharing — pujarighar.com/app
  // redirects straight to the Play Store listing.
  async redirects() {
    return [
      {
        source: "/app",
        destination: "https://play.google.com/store/apps/details?id=com.pujarighar.pujarighar_app",
        permanent: false,
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
    // WebP only — AVIF encoding via sharp/libvips is dramatically more
    // CPU-expensive than WebP (often 5-10x slower per image) for a modest
    // size win. On first page load, a dozen+ product cards plus the hero
    // all need an on-demand encode simultaneously; on this VPS that was the
    // direct cause of images taking over a minute to appear after the
    // sharp-CPU-compat fix made real encoding start happening at all.
    // WebP still beats plain JPEG significantly and encodes fast enough to
    // not stall concurrent first-time requests like this.
    formats: ["image/webp"],
    // Default imageSizes jumps 128 -> 256 -> 384 -> straight into
    // deviceSizes' 640/750/828 tier. Product-grid thumbnails render around
    // 200-435px CSS width (ProductCard's `sizes` prop), so on a 2-3x DPR
    // screen that gap forced Next to serve a 640-828px source for a ~260px
    // slot — most of the "image larger than its displayed dimensions"
    // Lighthouse findings. These extra steps let it pick something close
    // instead.
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 256, 320, 384, 480, 640],
    // Defaults to 60s — meaning every resized variant Next generates on
    // demand (one per distinct image × size × format) is treated as stale
    // and eligible to be reprocessed again after just a minute. A product
    // grid requests dozens of distinct images per page; on real browsing
    // (not a single warmed-up Lighthouse run) that compounds into
    // noticeably slow thumbnails well past the first visit. Our resize
    // pipeline gives a replaced image a new filename rather than
    // overwriting one in place, so there's no staleness risk in caching
    // these for a long time — a year is the standard "effectively
    // immutable" value for content-addressed/rarely-changing images.
    minimumCacheTTL: 31536000,
  },
};

export default withNextIntl(nextConfig);

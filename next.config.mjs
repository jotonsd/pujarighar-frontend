import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("src/lib/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8020" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "dev-api.pujarighar.com" },
    ],
  },
};

export default withNextIntl(nextConfig);

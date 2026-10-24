import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export so the site can be hosted on Cloudflare Pages.
  // (cacheComponents/partialPrefetching are not supported in export mode.)
  output: "export",
  images: { unoptimized: true },
  turbopack: { root: __dirname },
  // Trang 404 chung khi có nhiều root layout (tiếng Việt và tiếng Anh)
  experimental: { globalNotFound: true },
};

export default nextConfig;

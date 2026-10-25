import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export so the site can be hosted on Cloudflare Pages.
  // (cacheComponents/partialPrefetching are not supported in export mode.)
  output: "export",
  images: { unoptimized: true },
  turbopack: { root: __dirname },
  // Trang 404 chung (app/global-not-found.tsx) cho mọi đường dẫn không tồn tại
  experimental: { globalNotFound: true },
};

export default nextConfig;

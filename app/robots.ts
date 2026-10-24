import type { MetadataRoute } from "next";
import { getProfile } from "@/data/profile";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const base = getProfile("vi").website;
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}

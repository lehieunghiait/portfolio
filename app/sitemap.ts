import type { MetadataRoute } from "next";
import { getProfile, langs } from "@/data/profile";
import { paths } from "@/data/i18n";

export const dynamic = "force-static";

// Mỗi trang kèm đường dẫn bản ngôn ngữ còn lại để Google hiểu là hai bản dịch
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getProfile("vi").website;
  const pages = ["home", "cv"] as const;
  return pages.flatMap((page) =>
    langs.map((lang) => ({
      url: `${base}${paths[lang][page] === "/" ? "" : paths[lang][page]}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: page === "home" ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(langs.map((l) => [l, `${base}${paths[l][page] === "/" ? "" : paths[l][page]}`])),
      },
    })),
  );
}

import type { MetadataRoute } from "next";
import { getProfile, langs, type Lang } from "@/data/profile";
import { paths, postPath, projectPath } from "@/data/i18n";
import { posts } from "@/data/posts";

export const dynamic = "force-static";

// Mỗi trang kèm đường dẫn bản ngôn ngữ còn lại để Google hiểu là hai bản dịch
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getProfile("vi").website;
  const abs = (path: string) => `${base}${path === "/" ? "" : path}`;
  const pages: { href: (l: Lang) => string; priority: number }[] = [
    { href: (l) => paths[l].home, priority: 1 },
    { href: (l) => paths[l].cv, priority: 0.8 },
    { href: (l) => paths[l].blog, priority: 0.7 },
    ...getProfile("vi").projects.map((p) => ({ href: (l: Lang) => projectPath(l, p.slug), priority: 0.7 })),
    ...posts.map((p) => ({ href: (l: Lang) => postPath(l, p.slug), priority: 0.6 })),
  ];
  return pages.flatMap(({ href, priority }) =>
    langs.map((lang) => ({
      url: abs(href(lang)),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority,
      alternates: { languages: Object.fromEntries(langs.map((l) => [l, abs(href(l))])) },
    })),
  );
}

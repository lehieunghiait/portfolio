import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { getProfile, type Lang } from "@/data/profile";
import { paths } from "@/data/i18n";
import "../globals.css";

const font = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

// Áp dụng giao diện đã lưu trước khi trang hiển thị để không bị nháy sai màu
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;

// Dùng chung cho hai root layout (tiếng Việt và tiếng Anh), chỉ khác thuộc tính lang
export function RootShell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <html lang={lang} className={font.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// Tiêu đề, mô tả và liên kết hreflang giữa hai bản ngôn ngữ của cùng một trang.
// `hrefs`: đường dẫn trang này ở mỗi ngôn ngữ; `title` bỏ trống thì dùng tên + chức danh.
export function pageMetadata(
  lang: Lang,
  { hrefs, title, description, type = "profile" }:
  { hrefs: Record<Lang, string>; title?: string; description?: string; type?: "profile" | "article" | "website" },
): Metadata {
  const profile = getProfile(lang);
  const name = `${profile.name} — ${profile.title}`;
  const fullTitle = title ? `${title} | ${profile.name}` : name;
  const desc = description ?? profile.summary;
  return {
    metadataBase: new URL(profile.website),
    title: fullTitle,
    description: desc,
    alternates: {
      canonical: hrefs[lang],
      languages: { vi: hrefs.vi, en: hrefs.en, "x-default": hrefs.vi },
    },
    // Ảnh xem trước lấy từ opengraph-image.tsx của mỗi ngôn ngữ
    openGraph: {
      title: fullTitle,
      description: desc,
      url: hrefs[lang],
      siteName: profile.name,
      locale: lang === "vi" ? "vi_VN" : "en_US",
      alternateLocale: lang === "vi" ? "en_US" : "vi_VN",
      type,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description: desc },
  };
}

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

// Tiêu đề, mô tả và liên kết hreflang giữa hai bản ngôn ngữ của cùng một trang
export function pageMetadata(lang: Lang, page: "home" | "cv"): Metadata {
  const profile = getProfile(lang);
  const name = `${profile.name} — ${profile.title}`;
  return {
    metadataBase: new URL(profile.website),
    title: page === "cv" ? `CV — ${name}` : name,
    description: profile.summary,
    alternates: {
      canonical: paths[lang][page],
      languages: { vi: paths.vi[page], en: paths.en[page], "x-default": paths.vi[page] },
    },
    // Ảnh xem trước lấy từ opengraph-image.tsx của mỗi ngôn ngữ
    openGraph: {
      title: name,
      description: profile.summary,
      url: paths[lang][page],
      siteName: profile.name,
      locale: lang === "vi" ? "vi_VN" : "en_US",
      alternateLocale: lang === "vi" ? "en_US" : "vi_VN",
      type: "profile",
    },
    twitter: { card: "summary_large_image", title: name, description: profile.summary },
  };
}

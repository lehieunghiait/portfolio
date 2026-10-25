import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { getProfile, type Lang } from "@/data/profile";
import { paths } from "@/data/i18n";
import "../globals.css";
import { LangHtml } from "./lang-html";

const font = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

// Giao diện tối là mặc định; nếu người xem đã chọn giao diện khác thì áp dụng trước khi trang hiển thị
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;

// Root layout duy nhất (app/layout.tsx) dùng chung cho cả hai ngôn ngữ, nên chuyển ngôn ngữ là chuyển trang phía client
export function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <LangHtml className={font.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </LangHtml>
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
  const name = `${profile.name} (${profile.brand}) — ${profile.title}`;
  const fullTitle = title ? `${title} | ${profile.name}` : name;
  const desc = description ?? profile.seoDescription;
  return {
    metadataBase: new URL(profile.website),
    title: fullTitle,
    description: desc,
    alternates: {
      canonical: hrefs[lang],
      languages: { en: hrefs.en, vi: hrefs.vi, "x-default": hrefs.en },
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

// Dữ liệu cấu trúc (schema.org) cho trang chủ: giúp Google nhận ra trang này là của ai,
// kể cả khi tìm bằng tên gọi khác hoặc không dấu
export function PersonJsonLd({ lang }: { lang: Lang }) {
  const profile = getProfile(lang);
  const url = new URL(paths[lang].home, profile.website).href;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${profile.website}/#person`,
        name: profile.name,
        alternateName: profile.alternateNames,
        jobTitle: profile.title,
        description: profile.seoDescription,
        url: profile.website,
        image: new URL(profile.photo, profile.website).href,
        email: `mailto:${profile.email}`,
        sameAs: profile.links.map((l) => l.url),
        knowsAbout: profile.skills.flatMap((g) => g.items),
        alumniOf: profile.education.map((e) => ({ "@type": "CollegeOrUniversity", name: e.school })),
        // Nơi làm hiện tại: kinh nghiệm chưa có năm kết thúc
        worksFor: profile.experience
          .filter((e) => /present|hiện tại/i.test(e.period))
          .map((e) => ({ "@type": "Organization", name: e.company })),
      },
      {
        "@type": "WebSite",
        "@id": `${profile.website}/#website`,
        url: profile.website,
        name: profile.brand,
        alternateName: [profile.name, ...profile.alternateNames],
        inLanguage: ["en", "vi"],
        publisher: { "@id": `${profile.website}/#person` },
      },
      {
        "@type": "ProfilePage",
        url,
        inLanguage: lang,
        mainEntity: { "@id": `${profile.website}/#person` },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}

import Link from "next/link";
import { langs, type Lang } from "@/data/profile";
import { ui } from "@/data/i18n";

// Nút chuyển ngôn ngữ VI / EN: liên kết tới cùng trang ở ngôn ngữ kia, nền trượt sang ngôn ngữ đang chọn.
// Hai ngôn ngữ dùng chung root layout nên đây là điều hướng phía client; scroll={false} giữ nguyên vị trí đang đọc.
export function LangSwitch({ lang, hrefs }: { lang: Lang; hrefs: Record<Lang, string> }) {
  return (
    <nav className="lang-switch" data-lang={lang} aria-label={ui[lang].language}>
      {langs.map((l) => (
        <Link
          key={l}
          href={hrefs[l]}
          scroll={false}
          hrefLang={l}
          lang={l}
          aria-current={l === lang ? "page" : undefined}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}

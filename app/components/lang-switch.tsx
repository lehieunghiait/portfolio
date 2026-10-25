import { langs, type Lang } from "@/data/profile";
import { ui } from "@/data/i18n";

// Nút chuyển ngôn ngữ VI / EN: liên kết tới cùng trang ở ngôn ngữ kia, nền trượt sang ngôn ngữ đang chọn
export function LangSwitch({ lang, hrefs }: { lang: Lang; hrefs: Record<Lang, string> }) {
  return (
    <nav className="lang-switch" data-lang={lang} aria-label={ui[lang].language}>
      {langs.map((l) => (
        <a
          key={l}
          href={hrefs[l]}
          hrefLang={l}
          lang={l}
          aria-current={l === lang ? "page" : undefined}
        >
          {l.toUpperCase()}
        </a>
      ))}
    </nav>
  );
}

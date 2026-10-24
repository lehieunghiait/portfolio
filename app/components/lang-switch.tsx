import { langs, type Lang } from "@/data/profile";
import { paths, ui } from "@/data/i18n";

// Nút chuyển ngôn ngữ VI / EN: hai đường dẫn tĩnh, nền trượt sang ngôn ngữ đang chọn
export function LangSwitch({ lang, page }: { lang: Lang; page: "home" | "cv" }) {
  return (
    <nav className="lang-switch" data-lang={lang} aria-label={ui[lang].language}>
      {langs.map((l) => (
        <a
          key={l}
          href={paths[l][page]}
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

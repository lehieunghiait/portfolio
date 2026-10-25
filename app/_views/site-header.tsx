import Link from "next/link";
import { getProfile, type Lang } from "@/data/profile";
import { homeSection, paths, ui } from "@/data/i18n";
import s from "./portfolio.module.css";
import { Spotlight } from "../components/spotlight";
import { ThemeToggle } from "../components/theme-toggle";
import { LangSwitch } from "../components/lang-switch";
import { MobileMenu } from "../components/mobile-menu";

// Nền động, thanh tiến trình cuộn và thanh menu dùng chung cho trang chủ, trang dự án và blog.
// `onHome`: trên trang chủ các liên kết menu cuộn trong trang (#about), ở trang khác thì quay về trang chủ.
export function SiteHeader({ lang, hrefs, onHome = false }: { lang: Lang; hrefs: Record<Lang, string>; onHome?: boolean }) {
  const profile = getProfile(lang);
  const t = ui[lang];
  const initials = profile.name.split(" ").slice(-2).map((w) => w[0]).join("");
  const section = (id: string) => (onHome ? `#${id}` : homeSection(lang, id));
  const nav = [
    { href: section("about"), label: t.nav.about },
    { href: section("experience"), label: t.nav.experience },
    { href: section("projects"), label: t.nav.projects },
    { href: paths[lang].blog, label: t.nav.blog },
    { href: section("contact"), label: t.nav.contact },
  ];

  return (
    <>
      <Spotlight />
      <div className={s.progress} aria-hidden="true" />
      <div className={s.cursorGlow} aria-hidden="true" />
      <div className={s.backdrop} aria-hidden="true">
        <span className={s.blob1} />
        <span className={s.blob2} />
        <span className={s.blob3} />
      </div>

      <nav className={s.nav}>
        <div className={s.navInner}>
          <Link href={onHome ? "#top" : paths[lang].home} className={s.logo}>
            <span className={s.logoMark}>{initials}</span>
            <span className={s.logoText}>{profile.name}</span>
          </Link>
          <ul className={s.navLinks}>
            {nav.map((n) => <li key={n.href}><Link href={n.href}>{n.label}</Link></li>)}
          </ul>
          <LangSwitch lang={lang} hrefs={hrefs} />
          <ThemeToggle labels={t.theme} />
          <Link href={paths[lang].cv} className={s.navCta}>{t.viewCv}</Link>
          <MobileMenu items={nav} cta={{ href: paths[lang].cv, label: t.viewCv }} labels={t.menu} />
        </div>
      </nav>
    </>
  );
}

export function SiteFooter({ lang }: { lang: Lang }) {
  const profile = getProfile(lang);
  const t = ui[lang];
  return (
    <footer className={s.footer}>
      <p>© {new Date().getFullYear()} {profile.name} · {profile.brand}. {t.footer}</p>
      <a href="#top">{t.backToTop}</a>
    </footer>
  );
}

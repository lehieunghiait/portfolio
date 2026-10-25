import Link from "next/link";
import { ViewTransition } from "react";
import { getProfile, type Lang } from "@/data/profile";
import { homeSection, projectPath, ui } from "@/data/i18n";
import { SiteFooter, SiteHeader } from "./site-header";
import d from "./detail.module.css";
import { SmartImg } from "../components/smart-img";

// Trang chi tiết một dự án: bối cảnh → giải pháp → kết quả
export function ProjectDetail({ lang, slug }: { lang: Lang; slug: string }) {
  const profile = getProfile(lang);
  const t = ui[lang];
  const index = profile.projects.findIndex((p) => p.slug === slug);
  const p = profile.projects[index];
  const others = profile.projects.filter((o) => o.slug !== slug);

  return (
    <div className="page">
      <SiteHeader lang={lang} hrefs={{ vi: projectPath("vi", slug), en: projectPath("en", slug) }} />
      <main id="top" className={d.main}>
        <article className={d.article}>
          <Link href={homeSection(lang, "projects")} className={d.back}>{t.project.back}</Link>

          <header className={d.header}>
            <p className={d.eyebrow}>{p.year} · {p.role}</p>
            <ViewTransition name={`ptitle-${p.slug}`} share="morph" default="none"><h1 className={d.title}>{p.name}</h1></ViewTransition>
            <p className={d.lead}>{p.description}</p>
          </header>

          <dl className={d.facts}>
            <div><dt>{t.project.year}</dt><dd>{p.year}</dd></div>
            <div><dt>{t.project.role}</dt><dd>{p.role}</dd></div>
            <div className={d.factWide}>
              <dt>{t.project.stack}</dt>
              <dd><ul className={d.chips}>{p.tech.map((x) => <li key={x}>{x}</li>)}</ul></dd>
            </div>
            {p.link && (
              <div className={d.factAction}>
                <a href={p.link} target="_blank" rel="noreferrer" className={d.visit}>{t.project.visit} ↗</a>
              </div>
            )}
          </dl>

          {p.image && (
            <figure className={d.shot} data-tilt>
              <div className={d.browserBar} aria-hidden="true"><span /><span /><span /></div>
              <ViewTransition name={`shot-${p.slug}`} share="morph" default="none">
                <SmartImg placeholder src={p.image} alt={t.project.screenshotAlt(p.name)} width={1280} height={800} />
              </ViewTransition>
            </figure>
          )}

          <section className={d.section}>
            <h2><span>01</span> {t.project.context}</h2>
            <p>{p.context}</p>
          </section>
          <section className={d.section}>
            <h2><span>02</span> {t.project.solution}</h2>
            <ul className={d.list}>{p.solution.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>
          <section className={d.section}>
            <h2><span>03</span> {t.project.results}</h2>
            <ul className={`${d.list} ${d.results}`}>{p.results.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>

          {others.length > 0 && (
            <nav className={d.more} aria-label={t.project.more}>
              <h2>{t.project.more}</h2>
              <div className={d.moreGrid}>
                {others.map((o) => (
                  <Link key={o.slug} href={projectPath(lang, o.slug)} className={d.moreCard} data-spotlight>
                    <span className={d.moreMeta}>{o.year} · {o.role}</span>
                    <strong>{o.name} <span aria-hidden>→</span></strong>
                    <span>{o.description}</span>
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </article>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}

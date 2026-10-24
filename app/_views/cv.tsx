import { getProfile, type Lang } from "@/data/profile";
import { paths, ui } from "@/data/i18n";
import { PrintButton } from "../components/print-button";
import { ThemeToggle } from "../components/theme-toggle";
import { LangSwitch } from "../components/lang-switch";
import "./cv.css";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

export function Cv({ lang }: { lang: Lang }) {
  const profile = getProfile(lang);
  const t = ui[lang];

  return (
    <main className="cv-root">
      <div className="cv-toolbar no-print">
        <a href={paths[lang].home} className="cv-back">{t.cv.back}</a>
        <div className="cv-tools">
          <LangSwitch lang={lang} page="cv" />
          <ThemeToggle labels={t.theme} />
        </div>
      </div>
      <article className="cv">
        <aside className="sidebar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="avatar" src={profile.photoFace} alt={t.photoAlt(profile.name)} width={96} height={96} />
          <h1 className="name">{profile.name}</h1>
          <p className="role">{profile.title}</p>

          <div className="side-block">
            <h2 className="side-title">{t.cv.contact}</h2>
            <ul className="contact">
              <li><a href={`mailto:${profile.email}`}>{profile.email}</a></li>
              {profile.phone && <li><a href={`tel:${profile.phone.replace(/\s/g, "")}`}>{profile.phone}</a></li>}
              <li>{profile.location}</li>
              <li><a href={profile.website}>{profile.website.replace(/^https?:\/\//, "")}</a></li>
              {profile.links.map((l) => (
                <li key={l.label}><a href={l.url} target="_blank" rel="noreferrer">{l.label}</a></li>
              ))}
            </ul>
          </div>

          <div className="side-block">
            <h2 className="side-title">{t.cv.skills}</h2>
            {profile.skills.map((s) => (
              <div key={s.group} className="skill-group">
                <h3>{s.group}</h3>
                <ul className="tags">
                  {s.items.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <div className="side-block">
            <h2 className="side-title">{t.cv.languages}</h2>
            <ul className="languages">
              {profile.languages.map((l) => (
                <li key={l.name}><span>{l.name}</span><span className="muted">{l.level}</span></li>
              ))}
            </ul>
          </div>

          <PrintButton label={t.cv.download} />
        </aside>

        <div className="content">
          <Section title={t.cv.summary}>
            <p className="summary">{profile.summary}</p>
          </Section>

          <Section title={t.cv.experience}>
            <ol className="timeline">
              {profile.experience.map((e) => (
                <li key={e.company + e.period} className="item">
                  <div className="item-head">
                    <h3>{e.role} · <span className="accent">{e.company}</span></h3>
                    <span className="period">{e.period}</span>
                  </div>
                  {e.location && <p className="muted small">{e.location}</p>}
                  <ul className="bullets">
                    {e.highlights.map((h) => <li key={h}>{h}</li>)}
                  </ul>
                </li>
              ))}
            </ol>
          </Section>

          <Section title={t.cv.projects}>
            <div className="projects">
              {profile.projects.map((p) => (
                <div key={p.name} className="project">
                  <h3>
                    {p.link ? <a href={p.link} target="_blank" rel="noreferrer">{p.name} ↗</a> : p.name}
                  </h3>
                  <p>{p.description}</p>
                  <ul className="tags">
                    {p.tech.map((tech) => <li key={tech}>{tech}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t.cv.education}>
            {profile.education.map((ed) => (
              <div key={ed.school} className="item">
                <div className="item-head">
                  <h3>{ed.degree}</h3>
                  <span className="period">{ed.period}</span>
                </div>
                <p className="muted">{ed.school}</p>
                {ed.note && <p className="small">{ed.note}</p>}
              </div>
            ))}
          </Section>
        </div>
      </article>
    </main>
  );
}

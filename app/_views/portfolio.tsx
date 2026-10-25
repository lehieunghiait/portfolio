import { getProfile, type Lang } from "@/data/profile";
import { cvPdf, paths, projectPath, ui } from "@/data/i18n";
import { contactEndpoint, turnstileSiteKey } from "@/data/site";
import s from "./portfolio.module.css";
import { Typewriter } from "../components/typewriter";
import { CountUp } from "../components/count-up";
import { ContactForm } from "../components/contact-form";
import { SiteFooter, SiteHeader } from "./site-header";

// Mỗi dự án có một ảnh bìa gradient riêng, không cần file ảnh
const covers = [
  "linear-gradient(135deg, #6d4aff 0%, #22d3ee 100%)",
  "linear-gradient(135deg, #f43f5e 0%, #f59e0b 100%)",
  "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
  "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
];

function SectionHead({ index, eyebrow, title }: { index: string; eyebrow: string; title: string }) {
  return (
    <header className={s.sectionHead}>
      <p className={s.eyebrow}><span>{index}</span> {eyebrow}</p>
      <h2 className={s.sectionTitle}>{title}</h2>
    </header>
  );
}

export function Portfolio({ lang }: { lang: Lang }) {
  const profile = getProfile(lang);
  const t = ui[lang];
  const words = profile.name.split(" ");
  const firstName = words[words.length - 1];

  return (
    <>
      <SiteHeader lang={lang} hrefs={{ vi: paths.vi.home, en: paths.en.home }} onHome />

      <main id="top" className={s.main}>
        {/* Hero */}
        <section className={s.hero}>
          <div className={`${s.heroText} ${s.stagger}`}>
            {profile.available && (
              <p className={s.badge}><span className={s.pulse} /> {t.available}</p>
            )}
            <p className={s.hello}>{t.hello(firstName)} <span className={s.wave}>👋</span></p>
            <h1 className={s.heroTitle}>
              {profile.tagline}<br />
              <Typewriter words={profile.taglineWords} className={s.gradientText} />
            </h1>
            <p className={s.lead}>{profile.summary}</p>
            <div className={s.ctaRow}>
              <a href="#projects" className={s.btnPrimary}>{t.seeProjects} <span aria-hidden>→</span></a>
              <a href="#contact" className={s.btnGhost}>{t.contactMe}</a>
            </div>
            {profile.links.length > 0 && (
              <ul className={s.socials}>
                {profile.links.map((l) => (
                  <li key={l.label}><a href={l.url} target="_blank" rel="noreferrer">{l.label} ↗</a></li>
                ))}
              </ul>
            )}
          </div>

          <div className={s.heroVisual}>
            <div className={s.photoGlow} aria-hidden="true" />
            <div className={s.photoOrbit} aria-hidden="true" />
            <div className={s.photoFrame} data-spotlight data-tilt>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.photo} alt={t.photoAlt(profile.name)} width={528} height={660} fetchPriority="high" />
              <div className={s.photoCaption}>
                <strong>{profile.name}</strong>
                <span>{profile.title} · {profile.location}</span>
              </div>
            </div>
            <div className={`${s.floatChip} ${s.chipStatus}`}>
              <span className={s.pulse} /> {t.online}
            </div>
            <div className={`${s.floatChip} ${s.chipExp}`}>
              <strong className={s.gradientText}>{profile.stats[0]?.value}</strong>
              <span>{profile.stats[0]?.label}</span>
            </div>
            <div className={`${s.floatChip} ${s.chipStack}`}>
              <span aria-hidden="true">⚡</span> {profile.skills[0]?.items.slice(0, 3).join(" · ")}
            </div>
          </div>
        </section>

        {/* Stats */}
        <ul className={`${s.stats} ${s.reveal}`}>
          {profile.stats.map((st) => (
            <li key={st.label}>
              <strong><CountUp value={st.value} /></strong>
              <span>{st.label}</span>
            </li>
          ))}
        </ul>

        {/* Dải kỹ năng chạy ngang */}
        <div className={s.marquee} aria-hidden="true">
          <div className={s.marqueeTrack}>
            {[0, 1].map((k) => (
              <ul key={k}>
                {profile.skills.flatMap((g) => g.items).map((i) => <li key={i}>{i}<span>✦</span></li>)}
              </ul>
            ))}
          </div>
        </div>

        {/* About + skills */}
        <section id="about" className={`${s.section} ${s.reveal}`}>
          <SectionHead index="01" eyebrow={t.nav.about} title={t.aboutTitle} />
          <div className={s.aboutGrid}>
            <div className={s.aboutText}>
              <p>{profile.summary}</p>
              <ul className={s.langs}>
                {profile.languages.map((l) => (
                  <li key={l.name}><strong>{l.name}</strong> — {l.level}</li>
                ))}
              </ul>
            </div>
            <div className={s.skillGrid}>
              {profile.skills.map((g) => (
                <div key={g.group} className={s.skillCard} data-spotlight>
                  <h3>{g.group}</h3>
                  <ul className={s.chips}>
                    {g.items.map((i) => <li key={i}>{i}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Experience */}
        <section id="experience" className={`${s.section} ${s.reveal}`}>
          <SectionHead index="02" eyebrow={t.nav.experience} title={t.experienceTitle} />
          <ol className={s.timeline}>
            {profile.experience.map((e) => (
              <li key={e.company + e.period} className={s.job} data-spotlight>
                <span className={s.jobPeriod}>{e.period}</span>
                <div className={s.jobBody}>
                  <h3>{e.role} <span className={s.at}>@ {e.company}</span></h3>
                  {e.location && <p className={s.jobLoc}>{e.location}</p>}
                  <ul className={s.bullets}>
                    {e.highlights.map((h) => <li key={h}>{h}</li>)}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
          <div className={s.education}>
            {profile.education.map((ed) => (
              <div key={ed.school} className={s.eduCard}>
                <span className={s.eduIcon} aria-hidden>🎓</span>
                <div>
                  <h3>{ed.degree}</h3>
                  <p>{ed.school} · {ed.period}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section id="projects" className={`${s.section} ${s.reveal}`}>
          <SectionHead index="03" eyebrow={t.nav.projects} title={t.projectsTitle} />
          <div className={s.projects}>
            {profile.projects.map((p, i) => (
              <a key={p.slug} href={projectPath(lang, p.slug)} className={s.project} data-spotlight>
                <div className={s.cover} style={{ background: covers[i % covers.length] }}>
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={s.coverShot} src={p.image} alt="" width={1280} height={800} loading="lazy" />
                  ) : (
                    <span>{p.name.split(" ").map((w) => w[0]).join("").slice(0, 3)}</span>
                  )}
                </div>
                <div className={s.projectBody}>
                  <p className={s.projectMeta}>{p.year} · {p.role}</p>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <ul className={s.chips}>
                    {p.tech.map((tech) => <li key={tech}>{tech}</li>)}
                  </ul>
                  <span className={s.projectMore}>{t.viewProject} <span className={s.arrow} aria-hidden>→</span></span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className={`${s.contact} ${s.reveal}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.contactPhoto} src={profile.photoFace} alt="" width={88} height={88} loading="lazy" />
          <p className={s.eyebrow}><span>04</span> {t.nav.contact}</p>
          <h2 className={s.contactTitle}>
            {t.contactTitle[0]}<br /><span className={s.gradientText}>{t.contactTitle[1]}</span> {t.contactTitle[2]}
          </h2>
          <p className={s.lead}>{t.contactLead}</p>
          <ContactForm endpoint={contactEndpoint} siteKey={turnstileSiteKey} lang={lang} labels={t.form} />
          <p className={s.contactAlt}>
            {t.form.orEmail} <a href={`mailto:${profile.email}`}>{profile.email}</a>
            {profile.phone && <> · <a href={`tel:${profile.phone.replace(/\s/g, "")}`}>{profile.phone}</a></>}
          </p>
          <div className={s.ctaRow}>
            <a href={cvPdf[lang]} className={s.btnGhost} download>↓ {t.downloadCv}</a>
          </div>
        </section>
      </main>

      <SiteFooter lang={lang} />
    </>
  );
}

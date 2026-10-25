import type { Lang } from "@/data/profile";
import Link from "next/link";
import { ViewTransition } from "react";
import { paths, postPath, ui } from "@/data/i18n";
import { getPost, posts, type Block } from "@/data/posts";
import { SiteFooter, SiteHeader } from "./site-header";
import d from "./detail.module.css";
import { SmartImg } from "../components/smart-img";

// Ước tính thời gian đọc (~200 từ/phút)
function readingMinutes(blocks: Block[]) {
  const words = blocks
    .map((b) => (b.type === "ul" ? b.items.join(" ") : b.type === "code" ? b.code : b.type === "figure" ? (b.caption ?? "") : b.text))
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function BlogIndex({ lang }: { lang: Lang }) {
  const t = ui[lang];
  return (
    <>
      <SiteHeader lang={lang} hrefs={{ vi: paths.vi.blog, en: paths.en.blog }} />
      <main id="top" className={d.main}>
        <div className={d.article}>
          <header className={d.header}>
            <p className={d.eyebrow}>{t.blog.title}</p>
            <h1 className={d.title}>{t.blog.heading}</h1>
            <p className={d.lead}>{t.blog.lead}</p>
          </header>
          {posts.length === 0 && <p className={d.lead}>{t.blog.empty}</p>}
          <ol className={d.postList}>
            {posts.map((post) => {
              const c = post.content[lang];
              return (
                <li key={post.slug}>
                  <Link href={postPath(lang, post.slug)} className={`${d.postCard} ${post.cover ? d.hasCover : ""}`} data-spotlight>
                    {post.cover && (
                      <ViewTransition name={`cover-${post.slug}`} share="morph" default="none">
                        <SmartImg fade className={d.postCover} src={post.cover} alt="" width={1200} height={600} loading="lazy" />
                      </ViewTransition>
                    )}
                    <p className={d.postMeta}>
                      <time dateTime={post.date}>{t.blog.date(post.date)}</time> · {t.blog.minRead(readingMinutes(c.body))}
                    </p>
                    <ViewTransition name={`post-${post.slug}`} share="morph" default="none"><h2>{c.title}</h2></ViewTransition>
                    <p>{c.excerpt}</p>
                    <ul className={d.chips}>{post.tags.map((x) => <li key={x}>{x}</li>)}</ul>
                    <span className={d.readMore}>{t.blog.readMore} <span aria-hidden>→</span></span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "h2": return <h2>{block.text}</h2>;
    case "p": return <p>{block.text}</p>;
    case "ul": return <ul className={d.list}>{block.items.map((x) => <li key={x}>{x}</li>)}</ul>;
    case "note": return <aside className={d.note}>{block.text}</aside>;
    case "figure":
      // Bấm để mở ảnh gốc; trên màn hình hẹp sơ đồ giữ kích thước đọc được và cuộn ngang
      return (
        <figure className={d.figure}>
          <a href={block.src} target="_blank" rel="noreferrer" className={d.figureScroll} aria-label={block.alt}>
            <SmartImg placeholder src={block.src} alt={block.alt} loading="lazy" />
          </a>
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    case "code":
      return (
        <pre className={d.code} data-lang={block.lang}>
          <code>{block.code}</code>
        </pre>
      );
  }
}

export function BlogPost({ lang, slug }: { lang: Lang; slug: string }) {
  const t = ui[lang];
  const post = getPost(slug)!;
  const c = post.content[lang];
  return (
    <>
      <SiteHeader lang={lang} hrefs={{ vi: postPath("vi", slug), en: postPath("en", slug) }} />
      <main id="top" className={d.main}>
        <article className={d.article}>
          <Link href={paths[lang].blog} className={d.back}>{t.blog.back}</Link>
          <header className={d.header}>
            <p className={d.postMeta}>
              <time dateTime={post.date}>{t.blog.date(post.date)}</time> · {t.blog.minRead(readingMinutes(c.body))}
            </p>
            <ViewTransition name={`post-${post.slug}`} share="morph" default="none"><h1 className={d.title}>{c.title}</h1></ViewTransition>
            <p className={d.lead}>{c.excerpt}</p>
            <ul className={d.chips}>{post.tags.map((x) => <li key={x}>{x}</li>)}</ul>
          </header>
          {post.cover && (
            <ViewTransition name={`cover-${post.slug}`} share="morph" default="none">
              <SmartImg placeholder className={d.heroCover} src={post.cover} alt="" width={1200} height={600} />
            </ViewTransition>
          )}
          <div className={d.prose}>
            {c.body.map((b, i) => <BlockView key={i} block={b} />)}
          </div>
        </article>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}

# Lê Hiếu Nghĩa — Portfolio & CV

Bilingual (English / Vietnamese) personal portfolio, CV and technical blog — live at **[hieunghiagroup.online](https://hieunghiagroup.online)**.

![Deploy](https://github.com/lehieunghiait/portfolio/actions/workflows/deploy.yml/badge.svg)

## Highlights

- **Next.js 16 (App Router) static export** — no server runtime, hosted on Cloudflare Pages.
- **Two languages, one root layout** — English at `/`, Vietnamese at `/vi`; switching language is a client-side navigation (no reload), with hreflang, sitemap and per-language Open Graph images.
- **Client-side navigation with view transitions** — project screenshots and post titles morph between list and detail pages.
- **Dark / light themes** with a circular reveal transition, scroll-driven animations and `prefers-reduced-motion` support.
- **Printable CV** — `/cv` page plus PDFs generated at build time with headless Chrome.
- **Technical blog** with bilingual posts and generated SVG diagrams (`scripts/blog-art.py`).
- **Contact form** backed by a Cloudflare Worker: Turnstile anti-spam, Cloudflare Email Service and D1 storage.
- **Admin inbox** at `/admin` — Clerk authentication; the Worker verifies the session token and an `admin` role on every request.

## Tech stack

Next.js · React 19 · TypeScript · CSS Modules · Cloudflare Pages / Workers / D1 / Turnstile / Email Service · Clerk · Puppeteer

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static site in out/ + CV PDFs (needs a local Chrome)
```

Content lives in `data/` (profile, UI strings, blog posts) — most edits don't touch components.

## Deployment

Every push runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): it builds the site and deploys it to Cloudflare Pages — `main` goes to production, other branches get preview URLs. The contact Worker in `workers/contact/` is deployed separately with `npx wrangler deploy`.

## License

The source code is available for reference. Personal content (text, photos, CV) belongs to Lê Hiếu Nghĩa and may not be reused.

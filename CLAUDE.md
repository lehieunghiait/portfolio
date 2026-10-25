# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Bilingual (Vietnamese / English) personal portfolio + CV site for Lê Hiếu Nghĩa, built with Next.js 16 (App Router) as a **static export** and hosted on Cloudflare Pages at https://hieunghiagroup.online. Code comments and user-facing copy are written in Vietnamese.

## Next.js version warning (from AGENTS.md)

This Next.js version has breaking changes vs. training data. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices. `next dev` rewrites the block in `AGENTS.md` — commit it as-is.

## Commands

```bash
npm run dev      # dev server on :3000 (restart + `rm -rf .next` if Turbopack serves stale modules after data/ export changes)
npm run build    # next build -> out/, then scripts/build-pdf.mjs prints /cv and /vi/cv to out/*.pdf via local Chrome
npx wrangler pages deploy out --project-name hieunghiagroup --branch main   # deploy the site

cd workers/contact && npx wrangler deploy   # deploy the contact-form Worker (separate project)
```

There is no linter or test suite. Verify changes with `npm run build` (type-checks) and by serving `out/` and checking pages in a browser.

## Architecture

**Content is data-driven.** Almost all edits go in `data/`, not in components:
- `data/profile.ts` — `shared` (name, email, phone, photos, links) + `content.vi` / `content.en` (summary, skills, experience, projects with case-study fields, education). `getProfile(lang)` merges them. Keep the two languages in sync when editing one.
- `data/i18n.ts` — UI strings per language and all route helpers (`paths`, `projectPath`, `postPath`, `homeSection`, `cvPdf`). Never hardcode `/vi/...` URLs; use these helpers. `langs[0]` is the default language served at the root.
- `data/posts.ts` — the post list and the `Block`/`Post` types. Each post lives in its own file under `data/blog/`, as typed blocks (`p`, `h2`, `ul`, `code`, `note`) with `vi` and `en` content. Register a new post in the `posts` array, newest first. A post can have a `cover` image and `figure` blocks. These SVGs (covers, and per-language `-vi`/`-en` diagrams with their own dark background) are generated into `public/blog/<slug>/` by `python3 scripts/blog-art.py`. Edit diagrams there and re-run the script; don't hand-edit the SVG output. Posts are general technical write-ups: don't present employer-specific details or metrics as facts.
- `data/site.ts` — contact Worker endpoint, the public Turnstile site key and the Clerk publishable key.

**Bilingual routing via two root layouts.** There is no `app/layout.tsx`. `app/(en)/` serves English (the default) at `/` and `app/(vi)/vi/` serves Vietnamese at `/vi`; each group has its own `layout.tsx` calling `RootShell` (`app/_shared/root-layout.tsx`) so `<html lang>` is correct. Every route exists in both groups as a thin `page.tsx` that renders a shared view from `app/_views/` with a `lang` prop. When adding a route, add it to both groups, to `app/sitemap.ts`, and pass both language URLs to `pageMetadata(lang, { hrefs })` (it emits canonical + hreflang + OG tags). Dynamic routes use `generateStaticParams` + `dynamicParams = false`. Internal links use `next/link` (client-side navigation within a root layout). The language switch uses a plain `<a>`, because crossing root layouts is a full page load anyway. Shared elements (project screenshot and title, post title) morph between list and detail pages via React `<ViewTransition name share="morph" default="none">`. `@view-transition { navigation: auto; }` in `globals.css` covers full-page loads. The theme toggle adds a `theme-vt` class while its own view transition runs, so its circular reveal isn't mixed with page-transition names. Keep that pattern when adding transitions.

Because of multiple root layouts, 404 is `app/global-not-found.tsx` (requires `experimental.globalNotFound` in `next.config.ts`) and must include its own theme script and styles.

**Static export constraints.** `output: "export"` — no server runtime, no middleware, no `cacheComponents`/PPR (these fail the build). Metadata routes (`opengraph-image.tsx`, `apple-icon.tsx`, `sitemap.ts`, `robots.ts`) need `export const dynamic = "force-static"`. OG images are rendered with `next/og` using the Be Vietnam Pro TTFs in `assets/fonts/` (the bundled font lacks Vietnamese diacritics). Generated image files have no extension, so `public/_headers` sets their `Content-Type` for Cloudflare Pages. `public/_redirects` 301-redirects the old `/en/*` URLs to the root.

**Styling/theming.** Color tokens live in `app/globals.css` on `:root`, overridden for dark mode both under `@media (prefers-color-scheme: dark)` with `:root:not([data-theme="light"])` and under `:root[data-theme="dark"]` — update both blocks together. Dark is the default: `RootShell` renders `<html data-theme="dark">` and an inline script applies a saved `localStorage` choice pre-paint. Home/project/blog views use CSS modules (`portfolio.module.css`, `detail.module.css`); the CV page uses global `app/_views/cv.css` scoped under `.cv-root`, with an `@media print` block at the end of the file that forces light A4 output (it must stay last to win over earlier `display` rules). Client-only behavior is isolated in `app/components/` (typewriter, count-up, spotlight/tilt pointer tracking, theme toggle, contact form).

**Contact form backend.** `workers/contact/` is a standalone Cloudflare Worker (excluded from the Next tsconfig) that validates the form, verifies Cloudflare Turnstile (`TURNSTILE_SECRET` Worker secret), and sends mail through Cloudflare Email Service (`send_email` binding restricted to the owner's verified address, sender on `cf-bounce` subdomain). CORS origins are allow-listed in `workers/contact/wrangler.toml`. The domain's root MX records belong to Microsoft 365 — do not enable Email Routing on the zone, which would replace them.

Every submission is also stored in D1 (`portfolio-contact`, schema in `workers/contact/migrations/`; apply new migrations with `npx wrangler d1 migrations apply portfolio-contact --remote`).

**Admin (auth).** `/admin` exists only in the `(en)` group (noindex, disallowed in robots, not in the sitemap). `app/_views/admin.tsx` is a client component using `@clerk/react` v6: `<Show when="signed-in|signed-out">` replaces the removed `SignedIn`/`SignedOut`, and `<SignIn routing="hash">` is used because there is no server routing. It shows the inbox only when `user.publicMetadata.role === "admin"`, but that is cosmetic. The Worker's `/admin/messages` routes enforce access: `verifyToken` against `CLERK_SECRET_KEY` (a Worker secret), plus a `publicMetadata.role` lookup through the Clerk Backend API. Grant admin by setting `public_metadata.role = "admin"` on the user in the Clerk dashboard. A new site origin must be added to `ALLOWED_ORIGINS`, which is both the CORS allow-list and Clerk's `authorizedParties`.

## Deployment notes

- Cloudflare Pages project `hieunghiagroup` is Direct Upload (not Git-connected); deploy manually after `npm run build`.
- The zone currently serves a Cloudflare bot challenge to non-browser clients, so verify deployments against `https://hieunghiagroup.pages.dev` rather than the custom domain.

import { BlogIndex } from "@/app/_views/blog";
import { pageMetadata } from "@/app/_shared/root-layout";
import { paths, ui } from "@/data/i18n";

const LANG = "en";

export const metadata = pageMetadata(LANG, {
  title: ui[LANG].blog.heading, description: ui[LANG].blog.lead, type: "website",
  hrefs: { vi: paths.vi.blog, en: paths.en.blog },
});

export default function Page() {
  return <BlogIndex lang={LANG} />;
}

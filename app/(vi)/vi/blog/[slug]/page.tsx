import { BlogPost } from "@/app/_views/blog";
import { pageMetadata } from "@/app/_shared/root-layout";
import { getPost, posts } from "@/data/posts";
import { postPath } from "@/data/i18n";

const LANG = "vi";

export const dynamicParams = false;
export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getPost(slug)!.content[LANG];
  return pageMetadata(LANG, {
    title: c.title, description: c.excerpt, type: "article",
    hrefs: { vi: postPath("vi", slug), en: postPath("en", slug) },
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <BlogPost lang={LANG} slug={(await params).slug} />;
}

import { ProjectDetail } from "../../../_views/project";
import { pageMetadata } from "../../../_shared/root-layout";
import { getProfile } from "@/data/profile";
import { projectPath } from "@/data/i18n";

const LANG = "vi";

export const dynamicParams = false;
export function generateStaticParams() {
  return getProfile(LANG).projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProfile(LANG).projects.find((x) => x.slug === slug)!;
  return pageMetadata(LANG, {
    title: p.name, description: p.description, type: "article",
    hrefs: { vi: projectPath("vi", slug), en: projectPath("en", slug) },
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ProjectDetail lang={LANG} slug={(await params).slug} />;
}

import { Cv } from "../../../_views/cv";
import { pageMetadata } from "../../../_shared/root-layout";
import { paths } from "@/data/i18n";

export const metadata = pageMetadata("en", { title: "CV", hrefs: { vi: paths.vi.cv, en: paths.en.cv } });

export default function Page() {
  return <Cv lang="en" />;
}

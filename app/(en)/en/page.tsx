import { Portfolio } from "../../_views/portfolio";
import { pageMetadata } from "../../_shared/root-layout";
import { paths } from "@/data/i18n";

export const metadata = pageMetadata("en", { hrefs: { vi: paths.vi.home, en: paths.en.home } });

export default function Page() {
  return <Portfolio lang="en" />;
}

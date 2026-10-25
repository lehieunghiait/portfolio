import { Portfolio } from "@/app/_views/portfolio";
import { pageMetadata, PersonJsonLd } from "@/app/_shared/root-layout";
import { paths } from "@/data/i18n";

export const metadata = pageMetadata("en", { hrefs: { vi: paths.vi.home, en: paths.en.home } });

export default function Page() {
  return (
    <>
      <PersonJsonLd lang="en" />
      <Portfolio lang="en" />
    </>
  );
}

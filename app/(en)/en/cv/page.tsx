import { Cv } from "../../../_views/cv";
import { pageMetadata } from "../../../_shared/root-layout";

export const metadata = pageMetadata("en", "cv");

export default function Page() {
  return <Cv lang="en" />;
}

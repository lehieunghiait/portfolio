import { Cv } from "../../_views/cv";
import { pageMetadata } from "../../_shared/root-layout";

export const metadata = pageMetadata("vi", "cv");

export default function Page() {
  return <Cv lang="vi" />;
}

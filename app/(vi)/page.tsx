import { Portfolio } from "../_views/portfolio";
import { pageMetadata } from "../_shared/root-layout";

export const metadata = pageMetadata("vi", "home");

export default function Page() {
  return <Portfolio lang="vi" />;
}

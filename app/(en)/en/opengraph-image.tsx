import { getProfile } from "@/data/profile";
import { ogSize, renderOgImage } from "../../_shared/og";

export const alt = `${getProfile("en").name} — ${getProfile("en").title}`;
export const size = ogSize;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function Image() {
  return renderOgImage("en");
}

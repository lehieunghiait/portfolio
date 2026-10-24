import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Icon khi lưu trang ra màn hình chính iPhone/iPad
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default async function AppleIcon() {
  const extraBold = await readFile(join(process.cwd(), "assets/fonts/BeVietnamPro-ExtraBold.ttf"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Be Vietnam Pro", fontSize: 78, fontWeight: 800, color: "#fff", letterSpacing: -3,
          backgroundImage: "linear-gradient(135deg, #6d4aff, #0ab4d9)",
        }}
      >
        HN
      </div>
    ),
    { ...size, fonts: [{ name: "Be Vietnam Pro", data: extraBold, weight: 800, style: "normal" }] },
  );
}

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getProfile, type Lang } from "@/data/profile";
import { ui } from "@/data/i18n";

// Ảnh xem trước khi chia sẻ link (Facebook, Zalo, LinkedIn...), tạo lúc build.
export const ogSize = { width: 1200, height: 630 };

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));

export async function renderOgImage(lang: Lang) {
  const profile = getProfile(lang);
  const t = ui[lang];
  const [medium, bold, extraBold, photo] = await Promise.all([
    font("BeVietnamPro-Medium.ttf"),
    font("BeVietnamPro-Bold.ttf"),
    font("BeVietnamPro-ExtraBold.ttf"),
    readFile(join(process.cwd(), "public", profile.photo)),
  ]);
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;
  const domain = profile.website.replace(/^https?:\/\//, "");
  const initials = profile.name.split(" ").slice(-2).map((w) => w[0]).join("");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", alignItems: "center",
          padding: "0 72px", gap: 64, fontFamily: "Be Vietnam Pro", color: "#eceef6",
          background:
            "radial-gradient(circle at 85% 0%, rgba(139,109,255,0.45), transparent 50%), radial-gradient(circle at 0% 100%, rgba(34,211,238,0.25), transparent 45%), #08090f",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 12, alignSelf: "flex-start",
              padding: "10px 20px", borderRadius: 999, fontSize: 24, fontWeight: 500,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 999, background: "#4ade80" }} />
            {t.available}
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1, marginTop: 30, letterSpacing: -2 }}>
            {profile.name}
          </div>
          <div
            style={{
              fontSize: 40, fontWeight: 700, marginTop: 10,
              backgroundImage: "linear-gradient(90deg, #8b6dff, #22d3ee)",
              backgroundClip: "text", color: "transparent",
            }}
          >
            {profile.title}
          </div>
          <div style={{ fontSize: 26, fontWeight: 500, color: "#a1a6ba", marginTop: 24, lineHeight: 1.45 }}>
            {profile.skills.flatMap((g) => g.items).slice(0, 5).join(" · ")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 44, fontSize: 26, fontWeight: 700 }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, color: "#fff", backgroundImage: "linear-gradient(135deg, #8b6dff, #22d3ee)",
              }}
            >
              {initials}
            </div>
            {domain}
          </div>
        </div>

        {/* Ảnh có viền gradient */}
        <div
          style={{
            display: "flex", padding: 6, borderRadius: 36, transform: "rotate(-2deg)",
            backgroundImage: "linear-gradient(150deg, #8b6dff, #22d3ee 55%, #f472b6)",
            boxShadow: "0 30px 80px rgba(139,109,255,0.45)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc} width={352} height={440} style={{ borderRadius: 30, objectFit: "cover" }} alt="" />
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Be Vietnam Pro", data: medium, weight: 500, style: "normal" },
        { name: "Be Vietnam Pro", data: bold, weight: 700, style: "normal" },
        { name: "Be Vietnam Pro", data: extraBold, weight: 800, style: "normal" },
      ],
    },
  );
}

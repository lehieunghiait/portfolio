import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { paths } from "@/data/i18n";
import "./globals.css";
import "./global-not-found.css";

const font = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hieunghiagroup.online"),
  title: "404 — Không tìm thấy trang / Page not found",
};

// Áp dụng giao diện sáng/tối đã lưu (trang này không đi qua root layout)
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;

// Trang 404 chung cho mọi đường dẫn không tồn tại; song ngữ vì chưa biết người xem dùng ngôn ngữ nào
export default function GlobalNotFound() {
  return (
    <html lang="vi" className={font.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="nf">
        <div className="nf-glow" aria-hidden="true" />
        <main className="nf-card">
          <p className="nf-code">404</p>
          <h1>Không tìm thấy trang</h1>
          <p className="nf-sub" lang="en">Page not found</p>
          <p className="nf-text">
            Trang bạn tìm có thể đã được di chuyển hoặc không tồn tại.
            <br />
            <span lang="en">The page you are looking for may have moved or no longer exists.</span>
          </p>
          <div className="nf-actions">
            <a href={paths.vi.home} className="nf-btn nf-primary">Về trang chủ</a>
            <a href={paths.en.home} className="nf-btn" lang="en">Go to homepage</a>
          </div>
        </main>
      </body>
    </html>
  );
}

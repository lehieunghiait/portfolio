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
  title: "404 — Page not found / Không tìm thấy trang",
};

// Giao diện tối là mặc định; áp dụng lựa chọn đã lưu (trang này không đi qua root layout)
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;

// Trang 404 chung cho mọi đường dẫn không tồn tại; song ngữ vì chưa biết người xem dùng ngôn ngữ nào
export default function GlobalNotFound() {
  return (
    <html lang="en" className={font.variable} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="nf">
        <div className="nf-glow" aria-hidden="true" />
        <main className="nf-card">
          <p className="nf-code">404</p>
          <h1>Page not found</h1>
          <p className="nf-sub" lang="vi">Không tìm thấy trang</p>
          <p className="nf-text">
            The page you are looking for may have moved or no longer exists.
            <br />
            <span lang="vi">Trang bạn tìm có thể đã được di chuyển hoặc không tồn tại.</span>
          </p>
          <div className="nf-actions">
            <a href={paths.en.home} className="nf-btn nf-primary">Go to homepage</a>
            <a href={paths.vi.home} className="nf-btn" lang="vi">Về trang chủ</a>
          </div>
        </main>
      </body>
    </html>
  );
}

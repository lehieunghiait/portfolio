"use client";

import { usePathname } from "next/navigation";
import { langs, type Lang } from "@/data/profile";

// Ngôn ngữ của trang suy ra từ đường dẫn: "/vi" và "/vi/..." là tiếng Việt, còn lại là tiếng Anh (mặc định).
export function langFromPath(path: string): Lang {
  const first = path.split("/")[1];
  return (langs as readonly string[]).includes(first) ? (first as Lang) : langs[0];
}

// Thẻ <html> có lang đúng theo trang. Đặt trong component client để dùng usePathname:
// lúc build tĩnh mỗi trang vẫn có lang đúng trong HTML, khi chuyển trang phía client thì lang tự cập nhật.
export function LangHtml({ className, children }: { className: string; children: React.ReactNode }) {
  const lang = langFromPath(usePathname());
  return (
    <html lang={lang} className={className} data-theme="dark" suppressHydrationWarning>
      {children}
    </html>
  );
}

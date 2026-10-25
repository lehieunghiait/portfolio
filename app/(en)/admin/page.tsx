import type { Metadata } from "next";
import { AdminApp } from "@/app/_views/admin";

// Trang quản trị riêng: không index, không có trong sitemap, chỉ bản tiếng Anh
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}

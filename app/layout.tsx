import { RootShell } from "@/app/_shared/root-layout";

// Một root layout cho cả tiếng Anh (/) và tiếng Việt (/vi): <html lang> được tính theo đường dẫn
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <RootShell>{children}</RootShell>;
}

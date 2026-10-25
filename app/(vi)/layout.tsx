import { RootShell } from "@/app/_shared/root-layout";

export default function ViLayout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="vi">{children}</RootShell>;
}

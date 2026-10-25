"use client";

// Trạng thái đăng nhập trên thanh menu: chưa đăng nhập -> nút "Đăng nhập" tới /admin,
// đã đăng nhập -> avatar + tên (bấm để mở menu tài khoản Clerk, có lối vào trang quản trị).
import { ClerkLoading, ClerkProvider, Show, UserButton, useUser } from "@clerk/react";
import { enUS, viVN } from "@clerk/localizations";
import { clerkPublishableKey } from "@/data/site";

// Màu của Clerk theo token của trang; màu nhấn phải là màu cụ thể để Clerk sinh các sắc độ
export const clerkAppearance = {
  variables: {
    colorPrimary: "#7c5cff",
    colorPrimaryForeground: "#ffffff",
    colorBackground: "var(--bg-elev)",
    colorForeground: "var(--text)",
    colorMutedForeground: "var(--muted)",
    colorInput: "var(--bg)",
    colorInputForeground: "var(--text)",
    colorNeutral: "var(--text)",
    colorBorder: "var(--border)",
    fontFamily: "var(--font-sans)",
    borderRadius: "12px",
  },
};

export const clerkLocalization = { en: enUS, vi: viVN };

type Labels = { signIn: string; admin: string };

const AdminIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16v16H4z" /><path d="M4 9h16M9 20V9" />
  </svg>
);

// Dùng bên trong một ClerkProvider có sẵn (trang /admin)
export function UserChip({ labels }: { labels: Labels }) {
  const { user } = useUser();
  return (
    <>
      <ClerkLoading><span className="auth-skeleton" aria-hidden="true" /></ClerkLoading>
      <Show when="signed-out">
        <a href="/admin" className="auth-signin">{labels.signIn}</a>
      </Show>
      <Show when="signed-in">
        <span className="auth-user">
          <span className="auth-name">{user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress}</span>
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Link label={labels.admin} labelIcon={<AdminIcon />} href="/admin" />
            </UserButton.MenuItems>
          </UserButton>
        </span>
      </Show>
    </>
  );
}

// Dùng ở thanh menu các trang công khai: tự tạo ClerkProvider riêng
export function AuthStatus({ lang, labels }: { lang: "en" | "vi"; labels: Labels }) {
  if (!clerkPublishableKey) return null;
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} appearance={clerkAppearance} localization={clerkLocalization[lang]}>
      <UserChip labels={labels} />
    </ClerkProvider>
  );
}

"use client";

// Cấu hình Clerk dùng chung và khối tài khoản (avatar + tên) trên thanh menu trang /admin.
import { UserButton, useUser } from "@clerk/react";
import { enUS, viVN } from "@clerk/localizations";

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

const AdminIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16v16H4z" /><path d="M4 9h16M9 20V9" />
  </svg>
);

// Dùng bên trong ClerkProvider khi đã đăng nhập: tên + avatar, bấm để mở menu tài khoản
export function UserChip({ adminLabel }: { adminLabel: string }) {
  const { user } = useUser();
  return (
    <span className="auth-user">
      <span className="auth-name">{user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress}</span>
      <UserButton>
        <UserButton.MenuItems>
          <UserButton.Link label={adminLabel} labelIcon={<AdminIcon />} href="/admin" />
        </UserButton.MenuItems>
      </UserButton>
    </span>
  );
}
